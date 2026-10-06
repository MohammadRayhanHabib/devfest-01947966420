import { toBn, type Dict } from '../lib/i18n'
import type { Lang } from '../types'
import LangToggle from './LangToggle'
import { IconChecklist, IconFiles, IconPackage, IconTender, IconUpload } from './icons'

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
}

export const NAV = (t: Dict) => [
  { href: '#tender', label: t.navTender, icon: IconTender },
  { href: '#checklist', label: t.navChecklist, icon: IconChecklist },
  { href: '#files', label: t.navFiles, icon: IconFiles },
  { href: '#package', label: t.navPackage, icon: IconPackage },
]

export default function Sidebar(p: Props) {
  const { t, lang } = p
  const n = (x: number) => (lang === 'bn' ? toBn(x) : String(x))
  const pct = p.total ? Math.round((p.okCount / p.total) * 100) : 0
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 p-4 lg:flex">
      <div className="flex items-center gap-2 px-1">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#00a82d] text-white">
          <IconPackage className="h-4.5 w-4.5" />
        </span>
        <span className="text-[15px] font-semibold leading-tight text-neutral-900">{t.appTitle}</span>
      </div>
      <LangToggle lang={lang} onLang={p.onLang} />
      <div className="space-y-2">
        <button
          onClick={p.onOpenJson}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00a82d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#00962a]"
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
        {NAV(t).map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900"
          >
            <Icon className="h-4.5 w-4.5 text-neutral-500" />
            <span className="flex-1">{label}</span>
            {href === '#checklist' && p.problemCount > 0 && (
              <span className="rounded-md border border-red-300 px-1.5 text-[11px] font-semibold text-red-600">
                {n(p.problemCount)}
              </span>
            )}
            {href === '#files' && p.fileCount > 0 && (
              <span className="text-xs text-neutral-400">{n(p.fileCount)}</span>
            )}
          </a>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-neutral-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-700">{t.summary}</span>
          <span className="text-neutral-500">{t.readyOf(n(p.okCount), n(p.total))}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-[#00a82d] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </aside>
  )
}
