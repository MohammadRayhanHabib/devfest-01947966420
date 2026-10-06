import { toBn, type Dict } from '../lib/i18n'
import type { Lang, Requirement, Status, UploadedFile } from '../types'
import StatusBadge from './StatusBadge'

export interface OptionState {
  disabled: boolean
  note?: string
}

interface Props {
  t: Dict
  lang: Lang
  reqs: Requirement[]
  files: UploadedFile[]
  matches: Record<string, string>
  expiry: Record<string, string>
  statuses: Record<string, Status>
  optionState: (reqId: string, file: UploadedFile) => OptionState
  onMatch: (reqId: string, fileId: string) => void
  onExpiry: (reqId: string, date: string) => void
}

export default function ChecklistTable(p: Props) {
  const { t, lang } = p
  const name = (r: Requirement) => (lang === 'bn' ? r.title_bn : r.title_en)

  const fileSelect = (r: Requirement) => (
    <select
      value={p.matches[r.id] ?? ''}
      onChange={(e) => p.onMatch(r.id, e.target.value)}
      aria-label={`${t.colFile}: ${name(r)}`}
      className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 lg:max-w-56 lg:py-1.5"
    >
      <option value="">{t.chooseFile}</option>
      {p.files.map((f) => {
        const s = p.optionState(r.id, f)
        return (
          <option key={f.id} value={f.id} disabled={s.disabled}>
            {f.name}
            {s.note ? ` (${s.note})` : ''}
          </option>
        )
      })}
    </select>
  )

  const expiryCell = (r: Requirement) =>
    !r.has_expiry ? (
      <span className="text-xs text-neutral-400">{t.noExpiry}</span>
    ) : p.matches[r.id] ? (
      <input
        type="date"
        value={p.expiry[r.id] ?? ''}
        onChange={(e) => p.onExpiry(r.id, e.target.value)}
        aria-label={`${t.colExpiry}: ${name(r)}`}
        className={`w-full rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 lg:w-auto ${
          p.statuses[r.id] === 'expiry_needed' ? 'border-amber-400 bg-amber-50' : 'border-neutral-300'
        }`}
      />
    ) : (
      <span className="text-xs text-neutral-400">—</span>
    )

  return (
    <section id="checklist" className="scroll-mt-20">
      <h2 className="text-lg font-semibold text-neutral-900">
        {t.checklistTitle} <span className="text-sm font-normal text-neutral-400">{lang === 'bn' ? toBn(p.reqs.length) : p.reqs.length}</span>
      </h2>
      <p className="mt-1 text-sm text-neutral-600">{t.checklistDesc}</p>

      {/* Mobile: app-style cards */}
      <ul className="mt-4 space-y-3 lg:hidden">
        {p.reqs.map((r) => (
          <li key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-neutral-500">
                  #{lang === 'bn' ? toBn(r.order) : r.order} ·{' '}
                  <span className={r.mandatory ? 'text-neutral-700' : ''}>{r.mandatory ? t.mandatory : t.optional}</span>
                </p>
                <p className="font-semibold leading-snug text-neutral-900">{name(r)}</p>
              </div>
              <StatusBadge t={t} status={p.statuses[r.id]} />
            </div>
            <div className="mt-3 space-y-2">
              {fileSelect(r)}
              {r.has_expiry && p.matches[r.id] && (
                <label className="block text-xs font-medium text-neutral-600">
                  {t.colExpiry}
                  <div className="mt-1">{expiryCell(r)}</div>
                </label>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-neutral-200 lg:block">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-neutral-100 text-xs font-medium text-neutral-600">
            <tr>
              <th className="w-10 px-3 py-2.5">{t.colNo}</th>
              <th className="px-3 py-2.5">{t.colDoc}</th>
              <th className="px-3 py-2.5">{t.colFile}</th>
              <th className="px-3 py-2.5">{t.colExpiry}</th>
              <th className="px-3 py-2.5">{t.colStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {p.reqs.map((r) => (
              <tr key={r.id} className="align-middle hover:bg-neutral-50/60">
                <td className="px-3 py-3 text-neutral-500">{lang === 'bn' ? toBn(r.order) : r.order}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-neutral-900">{name(r)}</div>
                  <div className={`text-xs ${r.mandatory ? 'text-neutral-600' : 'text-neutral-400'}`}>
                    {r.mandatory ? t.mandatory : t.optional}
                  </div>
                </td>
                <td className="px-3 py-3">{fileSelect(r)}</td>
                <td className="px-3 py-3">{expiryCell(r)}</td>
                <td className="px-3 py-3">
                  <StatusBadge t={t} status={p.statuses[r.id]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
