import type { Dict } from '../lib/i18n'
import type { Lang } from '../types'
import { IconPackage } from './icons'

interface Props {
  t: Dict
  lang: Lang
  onLang: (l: Lang) => void
}

export default function Header({ t, lang, onLang }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between bg-neutral-900 px-4 text-white">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-white/10">
          <IconPackage className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold sm:text-base">{t.appTitle}</span>
      </div>
      <div role="group" aria-label="Language" className="flex rounded-lg bg-white/10 p-0.5 text-sm">
        {(['bn', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => onLang(l)}
            aria-pressed={lang === l}
            className={`rounded-md px-3 py-1 font-medium transition ${
              lang === l ? 'bg-white text-neutral-900' : 'text-white/80 hover:text-white'
            }`}
          >
            {l === 'bn' ? 'বাংলা' : 'English'}
          </button>
        ))}
      </div>
    </header>
  )
}
