import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import type { Requirement, Tender, UploadedFile } from '../types'

export type PdfCheck =
  | { ok: true; pages: number }
  | { ok: false; reason: 'not_pdf' | 'password' | 'damaged' }

// Checks that the bytes are a real, readable PDF and counts its pages.
export async function inspectPdf(bytes: ArrayBuffer): Promise<PdfCheck> {
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 1024))
  if (!head.includes('%PDF-')) return { ok: false, reason: 'not_pdf' }
  try {
    const doc = await PDFDocument.load(bytes, { throwOnInvalidObject: true })
    const pages = doc.getPageCount()
    return pages > 0 ? { ok: true, pages } : { ok: false, reason: 'damaged' }
  } catch (e) {
    const name = (e as { name?: string; constructor?: { name?: string } })?.constructor?.name ?? ''
    const msg = String((e as Error)?.message ?? '')
    if (name.includes('Encrypted') || /encrypt/i.test(msg)) return { ok: false, reason: 'password' }
    return { ok: false, reason: 'damaged' }
  }
}

export interface PackageItem {
  req: Requirement
  file: UploadedFile
}

const FOOTER_H = 28 // extra strip added under every document page, so the footer never covers content

// Standard PDF fonts only support Latin characters, so swap anything else for a safe character.
function safe(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[^\x20-\x7E -ÿ]/g, '?')
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of safe(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function rotationOf(page: PDFPage): number {
  return ((page.getRotation().angle % 360) + 360) % 360
}

// Grows the page by FOOTER_H on its visible bottom edge (respecting page rotation).
function addFooterSpace(page: PDFPage) {
  const b = page.getCropBox()
  const m = page.getMediaBox()
  let box = { x: b.x, y: b.y - FOOTER_H, width: b.width, height: b.height + FOOTER_H }
  const rot = rotationOf(page)
  if (rot === 90) box = { x: b.x, y: b.y, width: b.width + FOOTER_H, height: b.height }
  if (rot === 180) box = { x: b.x, y: b.y, width: b.width, height: b.height + FOOTER_H }
  if (rot === 270) box = { x: b.x - FOOTER_H, y: b.y, width: b.width + FOOTER_H, height: b.height }
  const x1 = Math.min(m.x, box.x)
  const y1 = Math.min(m.y, box.y)
  const x2 = Math.max(m.x + m.width, box.x + box.width)
  const y2 = Math.max(m.y + m.height, box.y + box.height)
  page.setMediaBox(x1, y1, x2 - x1, y2 - y1)
  page.setCropBox(box.x, box.y, box.width, box.height)
}

// Draws "<tender_id> | Page X of Y" centred on the visible bottom edge.
function drawFooter(page: PDFPage, text: string, font: PDFFont, whiteStrip: boolean) {
  const size = 9
  const color = rgb(0.25, 0.29, 0.35)
  const w = font.widthOfTextAtSize(text, size)
  const b = page.getCropBox()
  const rot = rotationOf(page)
  // Paint the added strip white so anything hidden by an old CropBox can't show through under the footer.
  if (whiteStrip) {
    const white = rgb(1, 1, 1)
    if (rot === 90) page.drawRectangle({ x: b.x + b.width - FOOTER_H, y: b.y, width: FOOTER_H, height: b.height, color: white })
    else if (rot === 180) page.drawRectangle({ x: b.x, y: b.y + b.height - FOOTER_H, width: b.width, height: FOOTER_H, color: white })
    else if (rot === 270) page.drawRectangle({ x: b.x, y: b.y, width: FOOTER_H, height: b.height, color: white })
    else page.drawRectangle({ x: b.x, y: b.y, width: b.width, height: FOOTER_H, color: white })
  }
  if (rot === 90) {
    page.drawText(text, { x: b.x + b.width - 10, y: b.y + b.height / 2 - w / 2, size, font, color, rotate: degrees(90) })
  } else if (rot === 180) {
    page.drawText(text, { x: b.x + b.width / 2 + w / 2, y: b.y + b.height - 10, size, font, color, rotate: degrees(180) })
  } else if (rot === 270) {
    page.drawText(text, { x: b.x + 10, y: b.y + b.height / 2 + w / 2, size, font, color, rotate: degrees(270) })
  } else {
    page.drawText(text, { x: b.x + b.width / 2 - w / 2, y: b.y + 10, size, font, color })
  }
}

function today(): string {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
}

function drawCover(
  page: PDFPage,
  tender: Tender,
  rows: { order: number; title: string; pages: number; start: number }[],
  font: PDFFont,
  bold: PDFFont,
) {
  const { width, height } = page.getSize()
  const m = 56
  const dark = rgb(0.06, 0.2, 0.3)
  const text = rgb(0.12, 0.14, 0.17)
  const muted = rgb(0.4, 0.44, 0.5)

  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: dark })
  page.drawText('TENDER SUBMISSION PACKAGE', { x: m, y: height - 62, size: 20, font: bold, color: rgb(1, 1, 1) })
  const banner = wrap(`${tender.tender_id} - ${tender.title}`, font, 11, width - m * 2)
  page.drawText(banner.length > 1 ? `${banner[0]}...` : banner[0], {
    x: m, y: height - 90, size: 11, font, color: rgb(0.8, 0.87, 0.93),
  })

  let y = height - 160
  const details: [string, string][] = [
    ['Tender ID', tender.tender_id],
    ['Tender Title', tender.title],
    ['Procuring Entity', tender.procuring_entity],
    ['Bidder', tender.bidder],
    ['Submission Deadline', tender.submission_deadline],
    ['Package Created', today()],
  ]
  for (const [label, value] of details) {
    page.drawText(label, { x: m, y, size: 10, font: bold, color: muted })
    for (const line of wrap(value, font, 11, width - m * 2 - 140)) {
      page.drawText(line, { x: m + 140, y, size: 11, font, color: text })
      y -= 15
    }
    y -= 5
  }

  y -= 14
  page.drawText('Included Documents', { x: m, y, size: 13, font: bold, color: dark })
  drawDocList(page, rows, y - 22, 10, font, bold)
}

type Row = { order: number; title: string; pages: number; start: number }

// Standard PDF fonts can't shape Bangla, so let the browser draw it on a canvas and embed that as an image.
async function bnImage(out: PDFDocument, text: string): Promise<PDFImage | undefined> {
  if (typeof document === 'undefined' || !text) return undefined
  try {
    const px = 40
    const fontSpec = `500 ${px}px 'Anek Bangla', 'Noto Sans Bengali', sans-serif`
    await document.fonts.load(fontSpec, text)
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')!
    ctx.font = fontSpec
    c.width = Math.ceil(ctx.measureText(text).width) + 8
    c.height = Math.ceil(px * 1.5)
    ctx.font = fontSpec
    ctx.fillStyle = '#5b6470'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 4, c.height / 2)
    const data = c.toDataURL('image/png')
    return await out.embedPng(data)
  } catch {
    return undefined
  }
}

// Table of documents: No. | Document | Pages | Starts on. Long titles are cut with "...".
// When Bangla images are given, each title gets its Bangla name on a second line.
function drawDocList(
  page: PDFPage,
  rows: Row[],
  top: number,
  baseSize: number,
  font: PDFFont,
  bold: PDFFont,
  bn: (PDFImage | undefined)[] = [],
) {
  const { width } = page.getSize()
  const m = 56
  const text = rgb(0.12, 0.14, 0.17)
  const muted = rgb(0.4, 0.44, 0.5)
  let y = top
  const cols = { no: m, title: m + 30, pages: width - m - 110, start: width - m - 50 }
  page.drawText('No.', { x: cols.no, y, size: 9, font: bold, color: muted })
  page.drawText('Document', { x: cols.title, y, size: 9, font: bold, color: muted })
  page.drawText('Pages', { x: cols.pages, y, size: 9, font: bold, color: muted })
  page.drawText('Starts on', { x: cols.start, y, size: 9, font: bold, color: muted })
  y -= 6
  page.drawLine({ start: { x: m, y }, end: { x: width - m, y }, thickness: 0.6, color: rgb(0.8, 0.83, 0.87) })
  y -= 14
  const size = rows.length > 20 ? baseSize - 1 : baseSize
  const step = rows.length > 20 ? size + 4 : size + 7
  rows.forEach((r, i) => {
    page.drawText(String(i + 1), { x: cols.no, y, size, font, color: text })
    const lines = wrap(r.title, font, size, cols.pages - cols.title - 24)
    page.drawText(lines.length > 1 ? `${lines[0]}...` : lines[0], { x: cols.title, y, size, font, color: text })
    page.drawText(String(r.pages), { x: cols.pages, y, size, font, color: text })
    page.drawText(`Page ${r.start}`, { x: cols.start, y, size, font, color: text })
    const img = bn[i]
    if (img) {
      const h = size + 3
      const w = Math.min((img.width / img.height) * h, cols.pages - cols.title - 24)
      page.drawImage(img, { x: cols.title, y: y - h - 4, width: w, height: h })
      y -= h + 4
    }
    y -= step
  })
}

// Bonus: a separate index page right after the cover.
function drawIndex(page: PDFPage, tender: Tender, rows: Row[], font: PDFFont, bold: PDFFont, bn: (PDFImage | undefined)[]) {
  const { width, height } = page.getSize()
  const dark = rgb(0.06, 0.2, 0.3)
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: dark })
  page.drawText('INDEX', { x: 56, y: height - 52, size: 20, font: bold, color: rgb(1, 1, 1) })
  page.drawText(safe(tender.tender_id), { x: 56, y: height - 74, size: 10, font, color: rgb(0.8, 0.87, 0.93) })
  drawDocList(page, rows, height - 130, 11, font, bold, bn)
}

// "1, 3-5" -> [1, 3, 4, 5]
export function parsePages(text: string): number[] {
  const out = new Set<number>()
  for (const part of text.split(/[,\s]+/).filter(Boolean)) {
    const [a, b] = part.split('-').map((n) => parseInt(n, 10))
    if (Number.isNaN(a)) continue
    for (let p = a; p <= (Number.isNaN(b) || b === undefined ? a : b) && p - a < 500; p++) out.add(p)
  }
  return [...out]
}

// Builds the final package: cover page, (optional index page), documents sorted by order, footer on every page.
export async function buildPackage(
  tender: Tender,
  items: PackageItem[],
  opts: { index?: boolean; seal?: { png: ArrayBuffer; pages: number[] } } = {},
): Promise<Uint8Array> {
  const sorted = [...items].sort((a, b) => a.req.order - b.req.order)
  const out = await PDFDocument.create()
  out.setTitle(`${tender.tender_id} Package`)
  const font = await out.embedFont(StandardFonts.Helvetica)
  const bold = await out.embedFont(StandardFonts.HelveticaBold)

  let start = opts.index ? 3 : 2 // page 1 is the cover, page 2 the index when it is on
  const rows = sorted.map((it) => {
    const row = { order: it.req.order, title: it.req.title_en, pages: it.file.pages, start }
    start += it.file.pages
    return row
  })

  const cover = out.addPage([595.28, 841.89])
  drawCover(cover, tender, rows, font, bold)
  if (opts.index) {
    const bn = await Promise.all(sorted.map((it) => (it.req.title_bn !== it.req.title_en ? bnImage(out, it.req.title_bn) : undefined)))
    drawIndex(out.addPage([595.28, 841.89]), tender, rows, font, bold, bn)
  }

  for (const it of sorted) {
    const src = await PDFDocument.load(it.file.bytes)
    const copied = await out.copyPages(src, src.getPageIndices())
    for (const p of copied) {
      addFooterSpace(p)
      out.addPage(p)
    }
  }

  const total = out.getPageCount()
  const ownPages = opts.index ? 2 : 1 // cover (and index) are ours, no strip to paint
  out.getPages().forEach((p, i) => drawFooter(p, `${safe(tender.tender_id)} | Page ${i + 1} of ${total}`, font, i >= ownPages))

  // Bonus: seal / signature image, bottom-right just above the footer strip, on the chosen pages.
  if (opts.seal) {
    const img = await out.embedPng(opts.seal.png)
    const w = 90
    const h = (img.height / img.width) * w
    for (const n of opts.seal.pages) {
      const p = out.getPages()[n - 1]
      if (!p) continue
      const b = p.getCropBox()
      p.drawImage(img, { x: b.x + b.width - w - 36, y: b.y + FOOTER_H + 10, width: w, height: h, opacity: 0.95 })
    }
  }
  return out.save()
}
