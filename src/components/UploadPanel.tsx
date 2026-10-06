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

// Step 2: a slim one-row drop zone with the uploaded files as a grid below it.
export default function UploadPanel(p: Props) {
  const { t } = p
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <section id="files" className="scroll-mt-20">
      <h2 className="text-lg font-semibold text-neutral-900">{t.addFiles}</h2>
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
        className={`mt-3 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-4 text-center transition sm:flex-row sm:text-left ${
          over ? 'border-brand bg-brand/5' : 'border-neutral-300 bg-[#f7f7f5]'
        }`}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm">
          <IconUpload className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-neutral-800">{t.dropTitle}</p>
          <p className="text-xs text-neutral-500">{t.dropHint}</p>
        </div>
        <button
          onClick={() => input.current?.click()}
          disabled={p.busy}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50"
        >
          <IconUpload />
          {t.selectFiles}
        </button>
        <input
          ref={input}
          id="pdf-input"
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
    </section>
  )
}
