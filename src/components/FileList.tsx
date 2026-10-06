import type { Dict } from '../lib/i18n'
import type { Lang, UploadedFile } from '../types'
import { IconAlert, IconFiles, IconX } from './icons'

export interface FileRow {
  file: UploadedFile
  duplicateOf?: string // name of another file with the same content
  matchedTo?: string // title of the document it is matched to
}

export interface Rejected {
  name: string
  message: string
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
  return (
    <div className="mt-5 space-y-5">
      {rejected.length > 0 && (
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
            {rejected.map((r, i) => (
              <li key={i} className="text-xs text-red-800">
                <span className="font-semibold break-all">{r.name}</span>: {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.uploaded}</p>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t.noFiles}</p>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100">
            {rows.map(({ file, duplicateOf, matchedTo }) => (
              <li key={file.id} className="flex items-start gap-2.5 py-2.5">
                <span className="mt-0.5 grid h-8 w-7 place-items-center rounded border border-neutral-300 text-[9px] font-bold text-neutral-500">
                  PDF
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {t.pages(file.pages)} · {kb(file.size)}
                  </p>
                  {matchedTo && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
                      <IconFiles className="h-3 w-3" /> {matchedTo}
                    </p>
                  )}
                  {duplicateOf && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                      <IconAlert className="h-3 w-3" /> {t.duplicate}: {t.duplicateHint(duplicateOf)}
                    </p>
                  )}
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
        )}
      </div>
    </div>
  )
}
