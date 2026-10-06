export interface Tender {
  tender_id: string
  title: string
  procuring_entity: string
  bidder: string
  submission_deadline: string // YYYY-MM-DD
}

export interface Requirement {
  id: string
  order: number
  title_en: string
  title_bn: string
  mandatory: boolean
  has_expiry: boolean
}

export interface RequirementsFile {
  tender: Tender
  requirements: Requirement[]
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  pages: number
  hash: string // SHA-256 of the file content, used to find duplicates
  bytes: ArrayBuffer
}

export type Status = 'missing' | 'expiry_needed' | 'expired' | 'not_provided' | 'ok'

export type Lang = 'en' | 'bn'
