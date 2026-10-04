// Shared class strings so every button and card looks the same (frontend-spec.md §10).
// Touch targets are at least 44px tall (min-h-11).

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-[0.9375rem] font-medium ' +
  'transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

export const buttonClass = {
  primary: `${buttonBase} bg-primary text-surface hover:bg-primary-hover`,
  secondary: `${buttonBase} border border-primary bg-surface text-primary hover:bg-primary-soft`,
  danger: `${buttonBase} border border-danger bg-surface text-danger hover:bg-danger hover:text-surface`,
  dangerSolid: `${buttonBase} bg-danger text-surface hover:brightness-90`,
  ghost: `${buttonBase} px-2 text-primary hover:bg-primary-soft`,
}

export const iconButtonClass =
  'inline-grid size-11 place-items-center rounded-lg text-muted transition-colors ' +
  'hover:bg-primary-soft hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-primary'

export const cardClass = 'rounded-[10px] border border-line bg-surface'

export const inputClass =
  'min-h-11 w-full rounded-lg border border-field-border bg-surface px-3 text-base text-ink ' +
  'focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-primary ' +
  'aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger'

export const linkClass =
  'font-medium text-primary underline underline-offset-3 hover:text-primary-hover ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm'
