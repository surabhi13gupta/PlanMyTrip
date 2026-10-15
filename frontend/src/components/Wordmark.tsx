/**
 * "Plan My Trip" with a handwritten "My" (Dancing Script): the brand name, drawn the same
 * everywhere (frontend-spec.md §10.1). Inherits size and color from where it's placed:
 * the logo and the My Trips greeting.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap ${className}`}>
      <span className="font-medium">Plan</span>
      <span className="ml-[0.06em] mr-[0.04em] font-script text-[1.32em] leading-[0.8] font-bold tracking-normal">
        My
      </span>
      <span className="font-semibold">Trip</span>
    </span>
  )
}
