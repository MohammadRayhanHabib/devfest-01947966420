import type { Dict } from '../lib/i18n'
import type { Tender } from '../types'

interface Props {
  t: Dict
  tender: Tender
  onLoadAnother: () => void
}

export default function TenderCard({ t, tender, onLoadAnother }: Props) {
  const rows: [string, string][] = [
    [t.tenderId, tender.tender_id],
    [t.entity, tender.procuring_entity],
    [t.bidder, tender.bidder],
    [t.deadline, tender.submission_deadline],
  ]
  return (
    <section id="tender" className="scroll-mt-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-500">{tender.tender_id}</p>
          <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">{tender.title}</h1>
        </div>
        <button
          onClick={onLoadAnother}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          {t.loadAnother}
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium text-neutral-500">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
