import { useState } from 'react'
import type { Dict } from '../lib/i18n'
import type { Lang, UploadedFile } from '../types'
import { IconAlert, IconFiles, IconX } from './icons'

export interface FileRow {
  file: UploadedFile
  duplicateOf?: string // name of another file with the same content
  matchedTo?: string // title of the document it is matched to
}

export type RejectReason = 'notPdf' | 'password' | 'damaged' | 'tooMany' | 'tooBig' | 'alreadyAdded'

// Only the reason is stored, so the message follows the current language.
export interface Rejected {
  name: string
  reason: RejectReason
}

interface Props {
  t: Dict
  lang: Lang
  rows: FileRow[]
  rejected: Rejected[]
  onRemove: (id: string) => void
  onClearRejected: () => void
}

const kb = (n: number) => (n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`)

export default function FileList({ t, rows, rejected, onRemove, onClearRejected }: Props) {
  // Long lists start collapsed; the user can show or hide them at any time.
  const [open, setOpen] = useState<boolean | null>(null)
  const isOpen = open ?? rows.length <= 6
  const dupCount = rows.filter((r) => r.duplicateOf).length
  // Re-adding the very same file isn't an error: show one quiet line instead of a red list.
  const alreadyCount = rejected.filter((r) => r.reason === 'alreadyAdded').length
  const problems = rejected.filter((r) => r.reason !== 'alreadyAdded')
  return (
    <div className="mt-4 space-y-4">
      {alreadyCount > 0 && (
        <p className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          {t.alreadySummary(alreadyCount)}
          {problems.length === 0 && (
            <button onClick={onClearRejected} className="font-medium underline">
              {t.clear}
            </button>
          )}
        </p>
      )}
      {problems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3" role="alert">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-red-800">
              <IconAlert /> {t.rejectedTitle}
            </p>
            <button onClick={onClearRejected} className="text-xs font-medium text-red-700 underline">
              {t.clear}
            </button>
          </div>
          <ul className="mt-2 space-y-1.5">
            {problems.map((r, i) => (
              <li key={i} className="text-xs text-red-800">
                <span className="font-semibold break-all">{r.name}</span>: {t[r.reason]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t.uploaded}
            {rows.length > 0 && (
              <span className="ml-2 font-normal normal-case tracking-normal text-neutral-500">
                {t.filesSummary(rows.length, dupCount)}
              </span>
            )}
          </p>
          {rows.length > 0 && (
            <button
              onClick={() => setOpen(!isOpen)}
              aria-expanded={isOpen}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {isOpen ? t.hideFiles : t.showFiles}
            </button>
          )}
        </div>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t.noFiles}</p>
        ) : (
          isOpen && (
            <ul className="mt-2 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {rows.map(({ file, duplicateOf, matchedTo }) => (
                <li key={file.id} className="flex items-center gap-3 px-3 py-2">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      duplicateOf ? 'bg-amber-100 text-amber-700' : 'bg-pink-100 text-pink-700'
                    }`}
                    aria-hidden="true"
                  >
                    <IconFiles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900" title={file.name}>
                      {file.name}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                      <span>
                        {t.pages(file.pages)} · {kb(file.size)}
                      </span>
                      {matchedTo && <span className="text-emerald-700">→ {matchedTo}</span>}
                      {duplicateOf && (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-700" title={t.duplicateHint(duplicateOf)}>
                          <IconAlert className="h-3 w-3" /> {t.duplicate}: {t.duplicateHint(duplicateOf)}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(file.id)}
                    aria-label={`${t.remove} ${file.name}`}
                    title={t.remove}
                    className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
                  >
                    <IconX />
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
