import { useEffect, useMemo, useRef, useState } from 'react'
import ChecklistTable, { type OptionState } from './components/ChecklistTable'
import type { FileRow, Rejected } from './components/FileList'
import GenerateBar from './components/GenerateBar'
import Header from './components/Header'
import { IconAlert, IconPackage, IconSave, IconSparkle, IconX } from './components/icons'
import Sidebar, { goTo } from './components/Sidebar'
import StepBlock from './components/StepBlock'
import Steps from './components/Steps'
import TenderCard from './components/TenderCard'
import UploadPanel from './components/UploadPanel'
import { sha256 } from './lib/hash'
import { dict } from './lib/i18n'
import { buildPackage, inspectPdf, parsePages } from './lib/pdf'
import { computeStatus, isBlocking } from './lib/status'
import { clearProject, loadProject, saveProject } from './lib/storage'
import type { Lang, RequirementsFile, Status, UploadedFile } from './types'

interface Saved {
  data: RequirementsFile | null
  files: UploadedFile[]
  matches: Record<string, string>
  expiry: Record<string, string>
  withIndex: boolean
  seal: { name: string; bytes: ArrayBuffer } | null
  sealPages: string
}

const MAX_FILES = 30
const MAX_BYTES = 50 * 1024 * 1024

function readLang(): Lang {
  try {
    return localStorage.getItem('lang') === 'bn' ? 'bn' : 'en' // English by default
  } catch {
    return 'en'
  }
}

// Checks that the JSON has the shape described in the problem statement.
function parseRequirements(text: string): RequirementsFile | null {
  try {
    const data = JSON.parse(text)
    const td = data?.tender
    const reqs = data?.requirements
    if (!td || typeof td.tender_id !== 'string' || typeof td.submission_deadline !== 'string') return null
    if (!Array.isArray(reqs) || reqs.length === 0) return null
    for (const r of reqs) {
      if (typeof r.id !== 'string' || typeof r.order !== 'number' || typeof r.title_en !== 'string') return null
    }
    return {
      tender: {
        tender_id: td.tender_id,
        title: String(td.title ?? ''),
        procuring_entity: String(td.procuring_entity ?? ''),
        bidder: String(td.bidder ?? ''),
        submission_deadline: td.submission_deadline,
      },
      requirements: reqs
        .map((r: Record<string, unknown>) => ({
          id: r.id as string,
          order: r.order as number,
          title_en: r.title_en as string,
          title_bn: typeof r.title_bn === 'string' && r.title_bn ? r.title_bn : (r.title_en as string),
          mandatory: Boolean(r.mandatory),
          has_expiry: Boolean(r.has_expiry),
        }))
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order),
    }
  } catch {
    return null
  }
}

function App() {
  const [lang, setLang] = useState<Lang>(readLang)
  const t = dict[lang]
  const [data, setData] = useState<RequirementsFile | null>(null)
  const [jsonError, setJsonError] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [rejected, setRejected] = useState<Rejected[]>([])
  const [matches, setMatches] = useState<Record<string, string>>({}) // requirement id -> file id
  const [expiry, setExpiry] = useState<Record<string, string>>({}) // requirement id -> YYYY-MM-DD
  const [uploading, setUploading] = useState(false)
  const [building, setBuilding] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string }>()
  const [autoCount, setAutoCount] = useState<number | null>(null)
  const [made, setMade] = useState(false) // package downloaded at least once (step 4 done)
  const [withIndex, setWithIndex] = useState(true)
  const [bannerHiddenAt, setBannerHiddenAt] = useState<number | null>(null) // closed until the problem count changes
  const [seal, setSeal] = useState<{ name: string; bytes: ArrayBuffer } | null>(null)
  const [sealPages, setSealPages] = useState('1')
  const [sealError, setSealError] = useState(false)
  const [restored, setRestored] = useState(false)
  const sealInput = useRef<HTMLInputElement>(null)

  // Bonus "save and reopen": restore the last project once, then save after every change.
  useEffect(() => {
    loadProject<Saved>().then((p) => {
      if (p?.data) {
        setData(p.data)
        setFiles(p.files ?? [])
        setMatches(p.matches ?? {})
        setExpiry(p.expiry ?? {})
        setWithIndex(p.withIndex ?? true)
        setSeal(p.seal ?? null)
        setSealPages(p.sealPages ?? '1')
      }
      setRestored(true)
    })
  }, [])
  useEffect(() => {
    if (restored) saveProject({ data, files, matches, expiry, withIndex, seal, sealPages } satisfies Saved)
  }, [restored, data, files, matches, expiry, withIndex, seal, sealPages])

  function startOver() {
    clearProject()
    setData(null)
    setFiles([])
    setMatches({})
    setExpiry({})
    setRejected([])
    setSeal(null)
    setSealPages('1')
    setMessage(undefined)
    setAutoCount(null)
    setMade(false)
  }

  async function addSeal(f: File) {
    const bytes = await f.arrayBuffer()
    const png = new Uint8Array(bytes.slice(0, 4))
    const isPng = png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e && png[3] === 0x47
    setSealError(!isPng)
    if (isPng) setSeal({ name: f.name, bytes })
  }
  const jsonInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = dict[lang].appTitle
    try {
      localStorage.setItem('lang', lang)
    } catch {
      /* storage blocked: language still works for this visit */
    }
  }, [lang])

  const reqs = data?.requirements ?? []
  const fileById = useMemo(() => new Map(files.map((f) => [f.id, f])), [files])

  const statuses = useMemo(() => {
    const out: Record<string, Status> = {}
    for (const r of reqs) {
      out[r.id] = computeStatus(r, Boolean(matches[r.id] && fileById.has(matches[r.id])), expiry[r.id], data?.tender.submission_deadline ?? '')
    }
    return out
  }, [reqs, matches, expiry, data, fileById])

  const title = (id: string) => {
    const r = reqs.find((x) => x.id === id)
    return r ? (lang === 'bn' ? r.title_bn : r.title_en) : id
  }

  const problems = data
    ? reqs.filter((r) => isBlocking(statuses[r.id])).map((r) => `${title(r.id)}: ${t.status[statuses[r.id]]}`)
    : [t.needTender]

  // A file can't be used twice, and a duplicate of a used file can't go to another document.
  const optionState = (reqId: string, file: UploadedFile): OptionState => {
    for (const [otherReq, otherFileId] of Object.entries(matches)) {
      if (otherReq === reqId) continue
      if (otherFileId === file.id) return { disabled: true, note: `${t.usedFor} ${title(otherReq)}` }
      const other = fileById.get(otherFileId)
      if (other && other.hash === file.hash) return { disabled: true, note: `${t.duplicate}, ${t.sameAs} ${other.name}` }
    }
    return { disabled: false }
  }

  const fileRows: FileRow[] = files.map((f) => {
    const twin = files.find((o) => o.id !== f.id && o.hash === f.hash)
    const reqId = Object.keys(matches).find((k) => matches[k] === f.id)
    return { file: f, duplicateOf: twin?.name, matchedTo: reqId ? title(reqId) : undefined }
  })

  async function loadJson(file: File) {
    const parsed = parseRequirements(await file.text())
    setJsonError(!parsed)
    if (parsed) {
      setData(parsed)
      setMatches({})
      setExpiry({})
      setMessage(undefined)
      setAutoCount(null)
      setMade(false)
    }
  }

  async function addFiles(list: File[]) {
    if (list.length === 0) return
    setUploading(true)
    const added: UploadedFile[] = []
    const bad: Rejected[] = []
    let count = files.length
    let total = files.reduce((s, f) => s + f.size, 0)
    for (const f of list) {
      if (count >= MAX_FILES) {
        bad.push({ name: f.name, reason: 'tooMany' })
        continue
      }
      if (total + f.size > MAX_BYTES) {
        bad.push({ name: f.name, reason: 'tooBig' })
        continue
      }
      const bytes = await f.arrayBuffer()
      const check = await inspectPdf(bytes)
      if (!check.ok) {
        bad.push({ name: f.name, reason: check.reason === 'not_pdf' ? 'notPdf' : check.reason })
        continue
      }
      const hash = await sha256(bytes)
      // The very same file (same name and content) added again is skipped, not shown as a duplicate.
      if ([...files, ...added].some((x) => x.name === f.name && x.hash === hash)) {
        bad.push({ name: f.name, reason: 'alreadyAdded' })
        continue
      }
      added.push({ id: crypto.randomUUID(), name: f.name, size: f.size, pages: check.pages, hash, bytes })
      count++
      total += f.size
    }
    setFiles((prev) => [...prev, ...added])
    setRejected(bad)
    setUploading(false)
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    const freed = Object.keys(matches).filter((k) => matches[k] === id)
    setMatches((prev) => Object.fromEntries(Object.entries(prev).filter(([, v]) => v !== id)))
    setExpiry((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !freed.includes(k))))
  }

  function setMatch(reqId: string, fileId: string) {
    setMatches((prev) => {
      const next = { ...prev }
      if (fileId) next[reqId] = fileId
      else delete next[reqId]
      return next
    })
    // A different file has a different expiry date, so ask for it again.
    setExpiry((prev) => {
      const next = { ...prev }
      delete next[reqId]
      return next
    })
    setMessage(undefined)
  }

  // Bonus: suggest matches from file names. Best word overlap wins; on a tie the newer year in the name wins.
  function autoMatch() {
    const words = (s: string) => s.toLowerCase().replace(/\.pdf$/, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2)
    const skip = new Set(['certificate', 'cert', 'the', 'and', 'for'])
    const year = (s: string) => Math.max(0, ...(s.match(/20\d\d/g) ?? []).map(Number))
    const pairs: { req: string; file: UploadedFile; score: number }[] = []
    for (const r of reqs) {
      if (matches[r.id]) continue
      const rw = words(r.title_en).filter((w) => !skip.has(w))
      for (const f of files) {
        const fw = words(f.name)
        const score = rw.filter((w) => fw.some((x) => x.slice(0, 5) === w.slice(0, 5))).length
        if (score > 0) pairs.push({ req: r.id, file: f, score })
      }
    }
    pairs.sort((a, b) => b.score - a.score || year(b.file.name) - year(a.file.name))
    const next = { ...matches }
    const usedFiles = new Set(Object.values(next))
    const usedHashes = new Set([...usedFiles].map((id) => fileById.get(id)?.hash))
    let count = 0
    for (const { req, file } of pairs) {
      if (next[req] || usedFiles.has(file.id) || usedHashes.has(file.hash)) continue
      next[req] = file.id
      usedFiles.add(file.id)
      usedHashes.add(file.hash)
      count++
    }
    setMatches(next)
    setAutoCount(count)
  }

  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  // Bonus: checklist as CSV (opens in Excel; BOM keeps Bangla text readable).
  function exportCsv() {
    if (!data) return
    const rows = reqs.map((r) => {
      const f = fileById.get(matches[r.id])
      return [title(r.id), f?.name ?? '', f ? String(f.pages) : '', expiry[r.id] ?? '', t.status[statuses[r.id]]]
    })
    const csv = [t.csvHead, ...rows].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n')
    download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `${data.tender.tender_id}_Checklist.csv`)
  }

  async function generate() {
    if (!data || problems.length > 0) return
    setBuilding(true)
    setMessage(undefined)
    try {
      const items = reqs
        .filter((r) => matches[r.id] && fileById.get(matches[r.id]))
        .map((r) => ({ req: r, file: fileById.get(matches[r.id])! }))
      const bytes = await buildPackage(data.tender, items, {
        index: withIndex,
        seal: seal ? { png: seal.bytes, pages: parsePages(sealPages) } : undefined,
      })
      const name = `${data.tender.tender_id}_Package.pdf`
      download(new Blob([bytes as BlobPart], { type: 'application/pdf' }), name)
      setMessage({ kind: 'ok', text: t.done(name) })
      setMade(true)
    } catch (e) {
      console.error(e)
      setMessage({ kind: 'error', text: t.genError })
    } finally {
      setBuilding(false)
    }
  }

  const okCount = reqs.filter((r) => statuses[r.id] === 'ok').length
  const problemCount = data ? problems.length : 0

  const steps = [Boolean(data), files.length > 0, Boolean(data) && problemCount === 0, made]
  const current = steps.findIndex((d) => !d)
  const openJson = () => jsonInput.current?.click()
  const openPdfs = () => document.getElementById('pdf-input')?.click()
  const uploadSection = (
    <UploadPanel
      t={t}
      lang={lang}
      rows={fileRows}
      rejected={rejected}
      busy={uploading}
      onFiles={addFiles}
      onRemove={removeFile}
      onClearRejected={() => setRejected([])}
    />
  )

  return (
    <div className="min-h-screen pb-16 lg:flex lg:pb-0">
      <Header t={t} lang={lang} onLang={setLang} hasData={Boolean(data)} />
      <Sidebar
        t={t}
        lang={lang}
        onLang={setLang}
        onOpenJson={openJson}
        onAddFiles={openPdfs}
        okCount={okCount}
        total={reqs.length}
        problemCount={problemCount}
        fileCount={files.length}
        hasData={Boolean(data)}
        steps={steps}
      />
      <input
        ref={jsonInput}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) loadJson(f)
          e.target.value = ''
        }}
      />
      <div className="min-w-0 flex-1 lg:flex lg:h-screen lg:flex-col lg:gap-3 lg:py-3 lg:pr-3">
        {data && problemCount > 0 && bannerHiddenAt !== problemCount && (
          // Evernote-style top bar: bold count, short hint, dark action button, close on the right.
          <div
            role="status"
            className="relative mx-4 mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-lg bg-amber-400 py-2.5 pl-4 pr-10 text-sm text-neutral-900 lg:mx-0 lg:mt-0"
          >
            <IconAlert className="h-4 w-4 shrink-0" />
            <p>
              <span className="font-bold">{t.bannerBold(problemCount)}</span> {t.bannerRest}
            </p>
            <button
              onClick={() => goTo('package')}
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-semibold text-white hover:bg-black"
            >
              {t.bannerAction}
            </button>
            <button
              onClick={() => setBannerHiddenAt(problemCount)}
              aria-label={t.dismiss}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-700 hover:bg-amber-300"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 bg-white lg:flex lg:overflow-hidden lg:rounded-2xl lg:border lg:border-neutral-200">
        <main className="min-w-0 flex-1 space-y-8 p-4 sm:p-6 lg:overflow-y-auto lg:p-8">
          {jsonError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
              {t.invalidJson}
            </p>
          )}
          {!data ? (
            <section id="tender" className="mx-auto flex max-w-lg flex-col items-center py-6 text-center lg:py-16">
              <div className="relative h-20 w-24" aria-hidden="true">
                <span className="absolute left-1 top-7 h-10 w-10 rotate-12 rounded-xl bg-lime-400" />
                <span className="absolute left-9 top-0 h-9 w-9 rounded-full bg-yellow-300" />
                <span className="absolute left-12 top-9 grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white">
                  <IconPackage className="h-5 w-5" />
                </span>
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-neutral-900">{t.loadTitle}</h1>
              <p className="mt-2 text-[15px] text-neutral-600">{t.loadDesc}</p>
              <div className="mt-8 w-full text-left">
                <Steps t={t} lang={lang} done={steps} layout="list" />
              </div>
              <button
                onClick={openJson}
                className="mt-8 rounded-lg bg-accent px-10 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-accent-dark"
              >
                {t.loadButton}
              </button>
            </section>
          ) : null}
          {!data && <div className="mx-auto max-w-2xl">{uploadSection}</div>}
          {data && (
            <div>
              <StepBlock n={1} lang={lang} done={steps[0]} active={current === 0}>
                <TenderCard t={t} tender={data.tender} onLoadAnother={openJson} />
                <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-neutral-100 text-neutral-500">
                    <IconSave className="h-3.5 w-3.5" />
                  </span>
                  {t.savedNote}
                  <button onClick={startOver} className="font-medium text-accent underline">
                    {t.startOver}
                  </button>
                </p>
              </StepBlock>
              <StepBlock n={2} lang={lang} done={steps[1]} active={current === 1}>
                {uploadSection}
              </StepBlock>
              <StepBlock n={3} lang={lang} done={steps[2]} active={current === 2}>
              {files.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={autoMatch}
                    className="inline-flex items-center gap-2 rounded-xl border border-accent py-1.5 pl-1.5 pr-4 text-sm font-semibold text-accent hover:bg-accent/5"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 text-violet-600">
                      <IconSparkle className="h-4 w-4" />
                    </span>
                    {t.autoMatch}
                  </button>
                  {autoCount !== null && (
                    <span className="text-sm text-neutral-600">{autoCount ? t.autoMatched(autoCount) : t.autoNone}</span>
                  )}
                </div>
              )}
              <ChecklistTable
                t={t}
                lang={lang}
                reqs={reqs}
                files={files}
                matches={matches}
                expiry={expiry}
                statuses={statuses}
                optionState={optionState}
                onMatch={setMatch}
                onExpiry={(id, d) => setExpiry((prev) => ({ ...prev, [id]: d }))}
              />
              </StepBlock>
              <StepBlock n={4} lang={lang} done={steps[3]} active={current === 3} last>
              <GenerateBar t={t} problems={problems} busy={building} message={message} onGenerate={generate}>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={withIndex}
                      onChange={(e) => setWithIndex(e.target.checked)}
                      className="h-4 w-4 accent-accent"
                    />
                    {t.indexOption}
                  </label>
                  <button
                    onClick={exportCsv}
                    className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {t.exportCsv}
                  </button>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-[#f7f7f5] p-3">
                  <p className="text-sm font-semibold text-neutral-800">{t.sealTitle}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <input
                      ref={sealInput}
                      type="file"
                      accept="image/png"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) addSeal(f)
                        e.target.value = ''
                      }}
                    />
                    {seal ? (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm">
                        {seal.name}
                        <button onClick={() => setSeal(null)} aria-label={`${t.remove} ${seal.name}`} className="text-neutral-400 hover:text-neutral-800">
                          <IconX className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => sealInput.current?.click()}
                        className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                      >
                        {t.sealAdd}
                      </button>
                    )}
                    <label className="flex items-center gap-2 text-sm text-neutral-700">
                      {t.sealPagesLabel}
                      <input
                        value={sealPages}
                        onChange={(e) => setSealPages(e.target.value)}
                        placeholder={t.sealPagesHint}
                        className="w-32 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                      />
                    </label>
                  </div>
                  {sealError && <p className="mt-2 text-sm text-red-700" role="alert">{t.sealNotPng}</p>}
                </div>
              </GenerateBar>
              </StepBlock>
            </div>
          )}
        </main>

        </div>
      </div>
    </div>
  )
}

export default App
