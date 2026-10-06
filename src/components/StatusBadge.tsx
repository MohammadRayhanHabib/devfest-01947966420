import type { Dict } from '../lib/i18n'
import type { Status } from '../types'

const styles: Record<Status, string> = {
  ok: 'bg-emerald-100 text-emerald-800',
  missing: 'bg-red-100 text-red-800',
  expired: 'bg-red-100 text-red-800',
  expiry_needed: 'bg-amber-100 text-amber-800',
  not_provided: 'bg-neutral-100 text-neutral-600',
}

export default function StatusBadge({ t, status }: { t: Dict; status: Status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {t.status[status]}
    </span>
  )
}
