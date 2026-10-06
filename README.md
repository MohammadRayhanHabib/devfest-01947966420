# Tender Package Builder · টেন্ডার প্যাকেজ বিল্ডার

AI DevFest 2026: AI Vibe-Coding Contest (Solo)

A frontend-only web app that helps office staff turn a set of tender PDFs into **one complete, checked and correctly ordered PDF package**, in Bangla or English.

## Participant
- **Name:** Mohammad Rayhan Habib
- **Registration No:** 01947966420

## Live Link
**https://devfest-01947966420.vercel.app**

## How to Run
Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev        # open http://localhost:5173
pnpm build      # production build in dist/
```

**How to use:**
1. Click **Open requirements.json** and pick the tender's `requirements.json`.
2. Add all PDF files: drag and drop them, or use **Select files**.
3. For each document, pick the matching file, or click **Auto-match by file name**. Enter expiry dates where asked.
4. Fix everything the yellow banner lists. Then click **Generate package** to download `<tender_id>_Package.pdf`.

## Main Features Done
- **Load list:** reads `requirements.json` and shows the tender details and required documents, sorted by `order`. An invalid file gets a clear error message.
- **Upload:** add many PDFs at once. Each file shows its name, page count and size. Non-PDF files are rejected with a clear message, and any file can be removed.
- **Match:** one file per document and one document per file. A file already used elsewhere is disabled in the list. Matches can be changed or undone at any time.
- **Expiry dates:** a date field appears when `has_expiry` is true and a file is matched. Changing the file resets the date.
- **Live status** for every document: Missing, Expiry date needed, Expired, Not provided, OK. An expiry on the deadline day counts as OK.
- **Duplicates:** files with the same content but different names are found by SHA-256 hash and marked in the file list. They cannot be matched to different documents.
- **Generate:** the button stays disabled while any blocking problem exists, and every reason is listed. A yellow banner shows the problem count.
- **Package PDF:** an English cover page (tender ID, title, procuring entity, bidder, deadline, date made, list of included documents), then all pages of each document in order. Optional documents with no file are skipped. Every page has the footer `<tender_id> | Page X of Y`. The footer goes on an extra strip added to each page, so it never covers content. This works for rotated and cropped pages too.
- **Download** as `<tender_id>_Package.pdf`.
- **Bangla / English** switch for the whole app. Document names come from `title_bn` / `title_en`, and the choice is remembered.
- **Responsive:** desktop dashboard layout. On phones it works like an app, with a top bar, a bottom tab bar and checklist cards.
- Everything runs in the browser. Files are never uploaded anywhere.

**Sample pack result:** `output/T-2026-0417_Package.pdf` was made in the app from `sample-pack`. The app found and resolved these problems in the pack:
- `company_logo.png` is not a PDF, so it was rejected.
- `experience_cert.pdf` and `experience_cert (1).pdf` are duplicates.
- `trade_license_2025.pdf` expired on 2025-06-30, so `trade_license_2026.pdf` (valid to 2027-06-30) was used instead.
- `scan_0042.pdf` is the Signed Declaration.
- The optional documents R06 and R07 are Not provided.

Screenshots are in `screenshots/`.

## Bonus Features
- **Index page** after the cover, showing the page where each document starts. It can be turned on or off.
- **Bangla text on the PDF:** the index page shows each document's Bangla name under the English one. The browser draws the Bangla on a canvas, so conjunct letters render correctly.
- **Seal or signature:** add a PNG (for example `company_logo.png`) and choose pages such as `1, 17` or `3-5`. It is placed at the bottom right, above the footer.
- **Export checklist as CSV** (document, file name, pages, expiry date, status), and it opens correctly in Excel, Bangla included.
- **Save and reopen:** all work, including the files, is saved in the browser (IndexedDB) and comes back after a reload. **Start over** clears it.
- **Auto-match** by file name. It uses word overlap, and on a tie the newer year in the name wins.
- **Bad files handled safely:** damaged or password-protected PDFs show a clear message instead of crashing.
- Step-by-step guide with a progress bar for first-time users.

## Known Problems
- The cover page is in English only, as the spec asks. Bangla appears only on the index page.
- On the cover and index, very long document titles are cut short with "...".
- The seal is placed at a fixed spot (bottom right).
- The date picker's display format follows the browser's locale.
- AI help (bonus) is not implemented.

## AI Tools Used
- **Claude Code** (Claude Opus 5.5): planning, code, testing and git commits.
- **Mobbin** (via MCP): UI reference screens only (Evernote, Klaviyo, Shopify). No assets were copied.

## Most Useful Prompt
> "Build the main features: load requirements.json, upload and check PDFs, find duplicates, match files to documents, show status for each document, and generate the final PDF package with a cover page and page footers."

## Tech Stack
Vite · React 19 · TypeScript · Tailwind CSS v4 · pdf-lib · Web Crypto (SHA-256). Hosted as a static site.

## License
MIT. See [LICENSE](LICENSE).
