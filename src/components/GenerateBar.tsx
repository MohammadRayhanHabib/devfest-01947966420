import type { Dict } from '../lib/i18n'
import { IconAlert, IconCheck, IconDownload } from './icons'

interface Props {
  t: Dict
  problems: string[]
  busy: boolean
  message?: { kind: 'ok' | 'error'; text: string }
  onGenerate: () => void
  children?: React.ReactNode // extra options (index page, CSV export)
}

export default function GenerateBar({ t, problems, busy, message, onGenerate, children }: Props) {
  const blocked = problems.length > 0
  return (
    <section id="package" className="scroll-mt-16 rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-neutral-900">{t.packageTitle}</h2>
      {blocked ? (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <p className="flex items-center gap-1.5 font-semibold">
            <IconAlert /> {t.blocked(problems.length)}
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-6">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
          <IconCheck /> {t.ready}
        </p>
      )}
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={blocked || busy}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4d5ef6] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3f4fe0] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:shadow-none"
        >
          <IconDownload />
          {busy ? t.generating : t.generate}
        </button>
        {message && (
          <p className={`text-sm font-medium ${message.kind === 'ok' ? 'text-emerald-700' : 'text-red-700'}`} role="status">
            {message.text}
          </p>
        )}
      </div>
    </section>
  )
}
