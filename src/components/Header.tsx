import type { Dict } from '../lib/i18n'
import type { Lang } from '../types'
import LangToggle from './LangToggle'
import { NAV } from './Sidebar'
import { IconPackage } from './icons'

interface Props {
  t: Dict
  lang: Lang
  onLang: (l: Lang) => void
}

// Mobile-only app bar (top) and tab bar (bottom). Desktop uses the sidebar.
export default function Header({ t, lang, onLang }: Props) {
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#00a82d] text-white">
            <IconPackage />
          </span>
          <span className="truncate text-sm font-semibold">{t.appTitle}</span>
        </div>
        <div className="w-40 shrink-0">
          <LangToggle lang={lang} onLang={onLang} />
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV(t).map(({ href, label, icon: Icon }) => (
          <a key={href} href={href} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-neutral-600">
            <Icon className="h-5 w-5" />
            {label}
          </a>
        ))}
      </nav>
    </>
  )
}
