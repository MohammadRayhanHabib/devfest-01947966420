import type { Dict } from '../lib/i18n'
import type { Status } from '../types'

// Quiet status style: a small coloured dot + text, no filled pill.
const dots: Record<Status, string> = {
  ok: 'bg-emerald-500',
  missing: 'bg-red-500',
  expired: 'bg-red-500',
  expiry_needed: 'bg-amber-500',
  not_provided: 'bg-neutral-300',
}

export default function StatusBadge({ t, status }: { t: Dict; status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-neutral-800">
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} aria-hidden="true" />
      {t.status[status]}
    </span>
  )
}
