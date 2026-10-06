import { useRef, useState } from 'react'
import type { Dict } from '../lib/i18n'
import type { Lang } from '../types'
import FileList, { type FileRow, type Rejected } from './FileList'
import { IconUpload } from './icons'

interface Props {
  t: Dict
  lang: Lang
  rows: FileRow[]
  rejected: Rejected[]
  busy: boolean
  onFiles: (files: File[]) => void
  onRemove: (id: string) => void
  onClearRejected: () => void
}

export default function UploadPanel(p: Props) {
  const { t } = p
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <aside
      id="files"
      className="w-full shrink-0 scroll-mt-16 border-t border-neutral-200 bg-white p-4 lg:w-80 lg:overflow-y-auto lg:border-l lg:border-t-0"
    >
      <h2 className="text-base font-semibold text-neutral-900">{t.addFiles}</h2>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          p.onFiles(Array.from(e.dataTransfer.files))
        }}
        className={`mt-3 flex flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          over ? 'border-blue-500 bg-blue-50' : 'border-neutral-300 bg-neutral-100'
        }`}
      >
        <p className="text-sm font-semibold text-neutral-800">{t.dropTitle}</p>
        <p className="mt-1 text-xs text-neutral-500">{t.dropHint}</p>
        <button
          onClick={() => input.current?.click()}
          disabled={p.busy}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          <IconUpload />
          {t.selectFiles}
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            p.onFiles(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>
      <FileList t={t} lang={p.lang} rows={p.rows} rejected={p.rejected} onRemove={p.onRemove} onClearRejected={p.onClearRejected} />
    </aside>
  )
}
