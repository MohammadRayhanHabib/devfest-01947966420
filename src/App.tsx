import { useEffect, useMemo, useRef, useState } from 'react'
import ChecklistTable, { type OptionState } from './components/ChecklistTable'
import type { FileRow, Rejected } from './components/FileList'
import GenerateBar from './components/GenerateBar'
import Header from './components/Header'
import { IconChecklist } from './components/icons'
import Sidebar from './components/Sidebar'
import TenderCard from './components/TenderCard'
import UploadPanel from './components/UploadPanel'
import { sha256 } from './lib/hash'
import { dict } from './lib/i18n'
import { buildPackage, inspectPdf } from './lib/pdf'
import { computeStatus, isBlocking } from './lib/status'
import type { Lang, RequirementsFile, Status, UploadedFile } from './types'

const MAX_FILES = 30
const MAX_BYTES = 50 * 1024 * 1024

function readLang(): Lang {
  try {
    return localStorage.getItem('lang') === 'en' ? 'en' : 'bn'
  } catch {
    return 'bn'
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
      out[r.id] = computeStatus(r, Boolean(matches[r.id]), expiry[r.id], data?.tender.submission_deadline ?? '')
    }
    return out
  }, [reqs, matches, expiry, data])

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
        bad.push({ name: f.name, message: t.tooMany })
        continue
      }
      if (total + f.size > MAX_BYTES) {
        bad.push({ name: f.name, message: t.tooBig })
        continue
      }
      const bytes = await f.arrayBuffer()
      const check = await inspectPdf(bytes)
      if (!check.ok) {
        bad.push({ name: f.name, message: t[check.reason === 'not_pdf' ? 'notPdf' : check.reason] })
        continue
      }
      added.push({ id: crypto.randomUUID(), name: f.name, size: f.size, pages: check.pages, hash: await sha256(bytes), bytes })
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

  async function generate() {
    if (!data || problems.length > 0) return
    setBuilding(true)
    setMessage(undefined)
    try {
      const items = reqs
        .filter((r) => matches[r.id] && fileById.get(matches[r.id]))
        .map((r) => ({ req: r, file: fileById.get(matches[r.id])! }))
      const bytes = await buildPackage(data.tender, items)
      const name = `${data.tender.tender_id}_Package.pdf`
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setMessage({ kind: 'ok', text: t.done(name) })
    } catch (e) {
      console.error(e)
      setMessage({ kind: 'error', text: t.genError })
    } finally {
      setBuilding(false)
    }
  }

  const okCount = reqs.filter((r) => statuses[r.id] === 'ok').length
  const problemCount = data ? problems.length : 0

  return (
    <div className="min-h-screen bg-white">
      <Header t={t} lang={lang} onLang={setLang} />
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
      <div className="lg:flex lg:h-[calc(100vh-3rem)]">
        <Sidebar t={t} lang={lang} okCount={okCount} problemCount={problemCount} fileCount={files.length} />
        <main className="min-w-0 flex-1 space-y-8 p-4 sm:p-6 lg:overflow-y-auto lg:p-8">
          {jsonError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
              {t.invalidJson}
            </p>
          )}
          {!data ? (
            <section id="tender" className="mx-auto max-w-xl rounded-2xl border border-neutral-200 p-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-neutral-100 text-neutral-700">
                <IconChecklist className="h-6 w-6" />
              </span>
              <h1 className="mt-4 text-2xl font-semibold text-neutral-900">{t.loadTitle}</h1>
              <p className="mt-2 text-sm text-neutral-600">{t.loadDesc}</p>
              <button
                onClick={() => jsonInput.current?.click()}
                className="mt-6 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                {t.loadButton}
              </button>
            </section>
          ) : (
            <>
              <TenderCard t={t} tender={data.tender} onLoadAnother={() => jsonInput.current?.click()} />
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
              <GenerateBar t={t} problems={problems} busy={building} message={message} onGenerate={generate} />
            </>
          )}
        </main>
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
      </div>
    </div>
  )
}

export default App
