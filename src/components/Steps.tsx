import { toBn, type Dict } from '../lib/i18n'
import type { Lang } from '../types'
import { IconCheck, IconChecklist, IconDownload, IconFiles, IconTender } from './icons'

interface Props {
  t: Dict
  lang: Lang
  done: boolean[] // loaded, files added, checks passed, package made
  layout?: 'grid' | 'list' // list = Evernote-style rows on the start screen
}

const ICONS = [IconTender, IconFiles, IconChecklist, IconDownload]
// Soft Evernote-style icon tiles; colour only here, the rest of the UI stays neutral.
const PASTEL = ['bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700', 'bg-lime-100 text-lime-700', 'bg-sky-100 text-sky-700']

// "Complete your setup" guide: dot progress + the four steps.
export default function Steps({ t, lang, done, layout = 'grid' }: Props) {
  const labels = [t.step1, t.step2, t.step3, t.step4]
  const current = done.findIndex((d) => !d)
  const chip = (i: number) =>
    done[i] ? 'bg-brand text-white' : PASTEL[i]

  return (
    <section aria-label={t.stepsTitle}>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {done.map((d, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-accent' : d ? 'w-3 bg-brand' : 'w-1.5 bg-neutral-300'
            }`}
          />
        ))}
      </div>

      {layout === 'list' ? (
        // Evernote-style feature rows: icon + bold title + grey description, no boxes.
        <ol className="mt-6 space-y-5">
          {labels.map((label, i) => {
            const Icon = ICONS[i]
            return (
              <li key={label} className="flex items-start gap-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${chip(i)}`}>
                  {done[i] ? <IconCheck /> : <Icon />}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-neutral-900">{label}</span>
                  <span className="block text-sm text-neutral-500">{t.stepDesc[i]}</span>
                </span>
              </li>
            )
          })}
        </ol>
      ) : (
        <ol className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
          {labels.map((label, i) => {
            const Icon = ICONS[i]
            return (
              <li key={label} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${chip(i)}`}>
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
      )}
    </section>
  )
}
