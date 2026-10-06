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
  return (
    <section id="checklist" className="scroll-mt-16">
      <h2 className="text-lg font-semibold text-neutral-900">{t.checklistTitle}</h2>
      <p className="mt-1 text-sm text-neutral-600">{t.checklistDesc}</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs font-medium text-neutral-500">
            <tr>
              <th className="w-10 px-3 py-2.5">{t.colNo}</th>
              <th className="px-3 py-2.5">{t.colDoc}</th>
              <th className="px-3 py-2.5">{t.colFile}</th>
              <th className="px-3 py-2.5">{t.colExpiry}</th>
              <th className="px-3 py-2.5">{t.colStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {p.reqs.map((r) => {
              const fileId = p.matches[r.id] ?? ''
              const status = p.statuses[r.id]
              return (
                <tr key={r.id} className="align-middle hover:bg-neutral-50/60">
                  <td className="px-3 py-3 text-neutral-500">{lang === 'bn' ? toBn(r.order) : r.order}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-neutral-900">{lang === 'bn' ? r.title_bn : r.title_en}</div>
                    <div className={`text-xs ${r.mandatory ? 'text-red-700' : 'text-neutral-500'}`}>
                      {r.mandatory ? t.mandatory : t.optional}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={fileId}
                      onChange={(e) => p.onMatch(r.id, e.target.value)}
                      aria-label={`${t.colFile}: ${lang === 'bn' ? r.title_bn : r.title_en}`}
                      className="w-full max-w-64 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                  </td>
                  <td className="px-3 py-3">
                    {!r.has_expiry ? (
                      <span className="text-xs text-neutral-400">{t.noExpiry}</span>
                    ) : fileId ? (
                      <input
                        type="date"
                        value={p.expiry[r.id] ?? ''}
                        onChange={(e) => p.onExpiry(r.id, e.target.value)}
                        aria-label={`${t.colExpiry}: ${lang === 'bn' ? r.title_bn : r.title_en}`}
                        className={`rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                          status === 'expiry_needed' ? 'border-amber-400' : 'border-neutral-300'
                        }`}
                      />
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge t={t} status={status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
