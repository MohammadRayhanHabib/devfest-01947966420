import type { Lang } from '../types'

export default function LangToggle({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  return (
    <div role="group" aria-label="ভাষা / Language" className="flex rounded-xl bg-neutral-200/70 p-1 text-sm">
      {(['bn', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onLang(l)}
          aria-pressed={lang === l}
          className={`flex-1 rounded-lg px-3 py-1 font-medium transition ${
            lang === l ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {l === 'bn' ? 'বাংলা' : 'English'}
        </button>
      ))}
    </div>
  )
}
