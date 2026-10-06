import { toBn, type Dict } from '../lib/i18n'
import type { Lang } from '../types'
import LangToggle from './LangToggle'
import { IconCheck, IconChecklist, IconFiles, IconPackage, IconTender, IconUpload } from './icons'

interface Props {
  t: Dict
  lang: Lang
  onLang: (l: Lang) => void
  onOpenJson: () => void
  onAddFiles: () => void
  okCount: number
  total: number
  problemCount: number
  fileCount: number
  hasData: boolean // checklist and package sections only exist after requirements.json is loaded
  steps: boolean[] // done flags in the same order as NAV
}

export const NAV = (t: Dict) => [
  { href: 'tender', label: t.navTender, icon: IconTender },
  { href: 'files', label: t.navFiles, icon: IconFiles },
  { href: 'checklist', label: t.navChecklist, icon: IconChecklist },
  { href: 'package', label: t.navPackage, icon: IconPackage },
]

// Smooth-scroll to a section without putting "#id" in the address bar.
export function goTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Sidebar(p: Props) {
  const { t, lang } = p
  const n = (x: number) => (lang === 'bn' ? toBn(x) : String(x))
  const pct = p.total ? Math.round((p.okCount / p.total) * 100) : 0
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 p-4 lg:flex">
      <div className="flex items-center gap-2 px-1">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">
          <IconPackage className="h-4.5 w-4.5" />
        </span>
        <span className="text-[15px] font-semibold leading-tight text-neutral-900">{t.appTitle}</span>
      </div>
      <LangToggle lang={lang} onLang={p.onLang} />
      <div className="space-y-2">
        <button
          onClick={p.onOpenJson}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
        >
          <IconChecklist /> {t.loadButton}
        </button>
        <button
          onClick={p.onAddFiles}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          <IconUpload /> {t.selectFiles}
        </button>
      </div>
      <nav className="space-y-0.5">
        {NAV(t).map(({ href, label }, i) => (
          <button
            key={href}
            onClick={() => goTo(href)}
            disabled={!p.hasData && (href === 'checklist' || href === 'package')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                p.steps[i] ? 'bg-emerald-500 text-white' : i === p.steps.findIndex((d) => !d) ? 'bg-brand text-white' : 'bg-neutral-200 text-neutral-500'
              }`}
            >
              {p.steps[i] ? <IconCheck className="h-3.5 w-3.5" /> : n(i + 1)}
            </span>
            <span className="flex-1">{label}</span>
            {href === 'checklist' && p.problemCount > 0 && (
              <span className="rounded-md border border-red-300 px-1.5 text-[11px] font-semibold text-red-600">
                {n(p.problemCount)}
              </span>
            )}
            {href === 'files' && p.fileCount > 0 && (
              <span className="text-xs text-neutral-400">{n(p.fileCount)}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-neutral-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-700">{t.summary}</span>
          <span className="text-neutral-500">{t.readyOf(n(p.okCount), n(p.total))}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </aside>
  )
}
