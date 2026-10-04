import { Link } from 'react-router'

type LogoVariant = 'onImage' | 'onLight'

const markColors: Record<LogoVariant, { pin: string; peaks: string }> = {
  onImage: { pin: 'fill-white', peaks: 'fill-primary' },
  onLight: { pin: 'fill-primary', peaks: 'fill-white' },
}

/** The mark: a map pin (a place to go) with two mountain peaks inside (the trip). */
export function LogoMark({ variant, className = '' }: { variant: LogoVariant; className?: string }) {
  const colors = markColors[variant]
  return (
    <svg viewBox="0 0 32 40" aria-hidden="true" focusable="false" className={className}>
      <path
        className={colors.pin}
        d="M16 1C7.7 1 1 7.6 1 15.8 1 26.4 16 39 16 39s15-12.6 15-23.2C31 7.6 24.3 1 16 1Z"
      />
      <path className={colors.peaks} d="M6.2 21.5 12.6 11.4l3.6 5.5 2.6-3.6 7 8.2Z" />
    </svg>
  )
}

/**
 * The PlanMyTrip logo: mark + "Plan My Trip" wordmark with a handwritten "My"
 * (frontend-spec.md §10.1). Never wraps or shrinks.
 */
export function Logo({ variant, to }: { variant: LogoVariant; to: string }) {
  const onImage = variant === 'onImage'
  return (
    <Link
      to={to}
      aria-label="PlanMyTrip, home"
      className={
        'inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-md whitespace-nowrap ' +
        'focus-visible:outline-3 focus-visible:outline-offset-2 ' +
        (onImage ? 'focus-visible:outline-white' : 'focus-visible:outline-primary')
      }
    >
      <LogoMark variant={variant} className="h-[42px] w-auto shrink-0 sm:h-12" />
      <span
        className={
          'inline-flex items-baseline text-[1.3rem] leading-none tracking-[-0.01em] sm:text-[1.45rem] ' +
          (onImage ? 'text-white [text-shadow:0_1px_2px_rgb(21_42_69/0.35)]' : 'text-primary')
        }
      >
        <span className="font-medium">Plan</span>
        <span className="ml-[0.06em] mr-[0.04em] font-script text-[1.32em] font-bold tracking-normal">My</span>
        <span className="font-semibold">Trip</span>
      </span>
    </Link>
  )
}
