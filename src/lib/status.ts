import type { Requirement, Status } from '../types'

// Status rules from Problem Statement Section 5.
// Dates are YYYY-MM-DD strings, so plain string comparison gives the right order.
export function computeStatus(
  req: Requirement,
  hasFile: boolean,
  expiry: string | undefined,
  deadline: string,
): Status {
  if (!hasFile) return req.mandatory ? 'missing' : 'not_provided'
  if (req.has_expiry) {
    if (!expiry) return 'expiry_needed'
    if (expiry < deadline) return 'expired' // same day as the deadline is still OK
  }
  return 'ok'
}

export function isBlocking(status: Status): boolean {
  return status === 'missing' || status === 'expiry_needed' || status === 'expired'
}
