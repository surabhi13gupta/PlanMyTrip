// Inline SVG icons (frontend-spec.md §13: no image files). Decorative: hidden from screen readers;
// the button around each icon carries the accessible name.

const common = {
  width: 18,
  height: 18,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  'aria-hidden': true,
} as const

export function EditIcon() {
  return (
    <svg {...common} strokeLinejoin="round">
      <path d="M13.5 3.5l3 3L7 16H4v-3z" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg {...common} strokeLinecap="round">
      <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" />
    </svg>
  )
}

export function AlertIcon() {
  return (
    <svg {...common} width={16} height={16} viewBox="0 0 16 16" strokeLinecap="round">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 4.5v4.2M8 11v.5" strokeWidth={1.8} />
    </svg>
  )
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span role={label ? 'status' : undefined} className="inline-flex items-center gap-2">
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="animate-spin motion-reduce:animate-none"
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
