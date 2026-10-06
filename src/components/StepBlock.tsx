import { toBn } from '../lib/i18n'
import type { Lang } from '../types'
import { IconCheck } from './icons'

interface Props {
  n: number
  lang: Lang
  done: boolean
  active: boolean
  last?: boolean
  children: React.ReactNode
}

// One numbered step of the vertical timeline: circle (number or ✓) + connecting line + the step's content.
export default function StepBlock({ n, lang, done, active, last, children }: Props) {
  return (
    <div className="relative pl-11 sm:pl-14">
      <span
        className={`absolute left-0 top-0 z-[1] grid h-8 w-8 place-items-center rounded-full text-sm font-bold sm:h-9 sm:w-9 ${
          done ? 'bg-emerald-500 text-white' : active ? 'bg-brand text-white ring-4 ring-brand/15' : 'bg-neutral-200 text-neutral-500'
        }`}
        aria-hidden="true"
      >
        {done ? <IconCheck /> : lang === 'bn' ? toBn(n) : n}
      </span>
      {!last && <span className="absolute bottom-0 left-4 top-10 w-px bg-neutral-200 sm:left-[17px]" aria-hidden="true" />}
      <div className={`pb-10 ${!done && !active ? 'opacity-90' : ''}`}>{children}</div>
    </div>
  )
}
