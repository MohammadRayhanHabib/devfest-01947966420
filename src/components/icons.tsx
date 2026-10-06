type P = { className?: string }
const base = 'shrink-0'

function Svg({ className = 'h-4 w-4', children }: P & { children: React.ReactNode }) {
  return (
    <svg
      className={`${base} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconTender = (p: P) => (
  <Svg {...p}>
    <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
  </Svg>
)
export const IconChecklist = (p: P) => (
  <Svg {...p}>
    <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
  </Svg>
)
export const IconFiles = (p: P) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </Svg>
)
export const IconPackage = (p: P) => (
  <Svg {...p}>
    <path d="M21 8 12 3 3 8l9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
  </Svg>
)
export const IconUpload = (p: P) => (
  <Svg {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
  </Svg>
)
export const IconX = (p: P) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)
export const IconAlert = (p: P) => (
  <Svg {...p}>
    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </Svg>
)
export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
)
export const IconSave = (p: P) => (
  <Svg {...p}>
    <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
    <path d="M8 3v5h7V3M8 21v-6h8v6" />
  </Svg>
)
export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </Svg>
)
export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v12M7 11l5 5 5-5M4 20h16" />
  </Svg>
)
