import { toBn, type Dict } from '../lib/i18n'
import type { Lang } from '../types'
import { IconChecklist, IconFiles, IconPackage, IconTender } from './icons'

interface Props {
  t: Dict
  lang: Lang
  okCount: number
  problemCount: number
  fileCount: number
}

export default function Sidebar({ t, lang, okCount, problemCount, fileCount }: Props) {
  const n = (x: number) => (lang === 'bn' ? toBn(x) : String(x))
  const items = [
    { href: '#tender', label: t.navTender, icon: IconTender },
    { href: '#checklist', label: t.navChecklist, icon: IconChecklist, badge: problemCount },
    { href: '#files', label: t.navFiles, icon: IconFiles },
    { href: '#package', label: t.navPackage, icon: IconPackage },
  ]
  return (
    <aside className="hidden w-56 shrink-0 flex-col justify-between border-r border-neutral-200 bg-neutral-100 p-3 lg:flex">
      <nav className="space-y-0.5">
        {items.map(({ href, label, icon: Icon, badge }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-white hover:text-neutral-900"
          >
            <Icon className="h-4 w-4 text-neutral-500" />
            <span className="flex-1">{label}</span>
            {badge ? (
              <span className="rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">{n(badge)}</span>
            ) : null}
          </a>
        ))}
      </nav>
      <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">{t.summary}</p>
        <dl className="space-y-1">
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t.sumOk}</dt>
            <dd className="font-semibold text-emerald-700">{n(okCount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t.sumProblems}</dt>
            <dd className="font-semibold text-red-700">{n(problemCount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">{t.sumFiles}</dt>
            <dd className="font-semibold text-neutral-900">{n(fileCount)}</dd>
          </div>
        </dl>
      </div>
    </aside>
  )
}
