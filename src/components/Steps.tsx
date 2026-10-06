import { toBn, type Dict } from '../lib/i18n'
import type { Lang } from '../types'
import { IconCheck, IconChecklist, IconDownload, IconFiles, IconTender } from './icons'

interface Props {
  t: Dict
  lang: Lang
  done: boolean[] // loaded, files added, checks passed, package made
}

const COLORS = ['bg-amber-300 text-amber-900', 'bg-pink-200 text-pink-800', 'bg-lime-300 text-lime-900', 'bg-sky-200 text-sky-900']
const ICONS = [IconTender, IconFiles, IconChecklist, IconDownload]

// Evernote-style "complete your setup" guide: dot progress + numbered steps with coloured icons.
export default function Steps({ t, lang, done }: Props) {
  const labels = [t.step1, t.step2, t.step3, t.step4]
  const current = done.findIndex((d) => !d)
  return (
    <section aria-label={t.stepsTitle}>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {done.map((d, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-[#4d5ef6]' : d ? 'w-3 bg-[#00a82d]' : 'w-1.5 bg-neutral-300'
            }`}
          />
        ))}
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {labels.map((label, i) => {
          const Icon = ICONS[i]
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                i === current ? 'border-[#4d5ef6] bg-[#4d5ef6]/5' : 'border-neutral-200 bg-white'
              }`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${done[i] ? 'bg-[#00a82d] text-white' : COLORS[i]}`}>
                {done[i] ? <IconCheck /> : <Icon />}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-neutral-500">
                  {lang === 'bn' ? `ধাপ ${toBn(i + 1)}` : `Step ${i + 1}`}
                </span>
                <span className="block text-sm font-semibold leading-tight text-neutral-900">{label}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
