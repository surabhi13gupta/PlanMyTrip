import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '../api/client'
import { useActivityMutations, useIdeas } from '../hooks/useTrips'
import { formatDayLabel } from '../lib/dates'
import { toastError } from '../lib/errors'
import { ideasForTripType, ideaToActivity, shortCount, type IdeaCategory, type IdeaIcon } from '../lib/ideas'
import { mapsSearchUrl } from '../lib/maps'
import type { IdeaPlace, TripDay, TripDetail } from '../types'
import { Spinner } from './Icons'
import { IdeaGlyph } from './IdeaGlyph'
import { MapLink } from './MapLink'
import { Skeleton } from './States'
import { buttonClass, iconButtonClass, inputClass, linkClass } from './ui'

interface IdeasPanelProps {
  trip: TripDetail
  days: TripDay[]
  open: boolean
  /** The day every "Add" button uses; picked in the panel's header. */
  dayNumber: number
  onDayChange: (dayNumber: number) => void
  onClose: () => void
}

/**
 * The Ideas panel (frontend-spec.md §4.5.1, US8): Google Maps places by category, each addable
 * to a day. Docked on the right on laptops (lg), a sheet from the bottom below that. It stays
 * mounted while closed, so the last tab picked is remembered for the visit.
 */
export function IdeasPanel({ trip, days, open, dayNumber, onDayChange, onClose }: IdeasPanelProps) {
  const categories = ideasForTripType(trip.tripType)
  const [categoryId, setCategoryId] = useState(categories[0].id)
  // A Trip Type change can remove the open tab; fall back to Top sights.
  const category = categories.find((c) => c.id === categoryId) ?? categories[0]
  // "idea id|day" for everything added during this visit.
  const [added, setAdded] = useState<Set<string>>(() => new Set())
  const [addingKey, setAddingKey] = useState<string | null>(null)
  const mutations = useActivityMutations(trip.id)
  const ideas = useIdeas(trip.id, trip.destination, category.id, open)
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    // Focus moves into the panel, and back to whatever opened it when it closes (§11).
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [open, onClose])

  const add = (idea: IdeaPlace) => {
    const key = `${idea.id}|${dayNumber}`
    setAddingKey(key)
    mutations.add.mutate(
      { dayNumber, ...ideaToActivity(idea) },
      {
        onSuccess: () => {
          setAdded((prev) => new Set(prev).add(key))
          // On laptops the plan is visible beside the panel; phones need to be told.
          if (!window.matchMedia?.('(min-width: 1024px)').matches) toast.success(`Added to Day ${dayNumber}`)
        },
        onError: toastError,
        onSettled: () => setAddingKey(null),
      },
    )
  }

  return (
    <>
      {open && (
        <div aria-hidden="true" className="fixed inset-0 z-30 bg-ink/45 lg:hidden" onClick={onClose} />
      )}
      <aside
        role="dialog"
        aria-labelledby={titleId}
        hidden={!open}
        className={
          'fixed inset-x-0 bottom-0 z-40 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl ' +
          'lg:sticky lg:top-4 lg:z-auto lg:h-[calc(100dvh-2rem)] lg:rounded-[10px] lg:border lg:border-line lg:shadow-none'
        }
      >
        <div aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line lg:hidden" />
        <div className="grid gap-2.5 border-b border-line px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-2">
            <h2 id={titleId} className="min-w-0 text-lg font-semibold break-words text-primary">
              Ideas for {trip.destination}
            </h2>
            <button ref={closeRef} type="button" className={iconButtonClass} aria-label="Close ideas" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor={`${titleId}-day`} className="shrink-0 text-[0.9375rem] font-medium text-muted">
              Add to
            </label>
            <select
              id={`${titleId}-day`}
              className={`${inputClass} min-h-10`}
              value={dayNumber}
              onChange={(e) => onDayChange(Number(e.target.value))}
            >
              {days.map((day) => (
                <option key={day.dayNumber} value={day.dayNumber}>
                  Day {day.dayNumber} · {formatDayLabel(day.date)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div role="tablist" aria-label="Idea categories" className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-line px-4 py-2.5">
          {categories.map((c) => {
            const selected = c.id === category.id
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                id={`${titleId}-tab-${c.id}`}
                aria-selected={selected}
                aria-controls={`${titleId}-list`}
                onClick={() => setCategoryId(c.id)}
                className={
                  'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border pr-3 pl-2 text-sm font-medium whitespace-nowrap ' +
                  'transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
                  (selected
                    ? 'border-primary bg-primary text-surface'
                    : c.byTripType
                      ? 'border-transparent bg-primary-soft text-primary hover:border-primary'
                      : 'border-line bg-surface text-ink hover:bg-primary-soft')
                }
              >
                <IdeaGlyph icon={c.icon} size={16} />
                {c.label}
              </button>
            )
          })}
        </div>

        <div
          id={`${titleId}-list`}
          role="tabpanel"
          aria-labelledby={`${titleId}-tab-${category.id}`}
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-2"
        >
          {ideas.isPending ? (
            <IdeasSkeleton />
          ) : ideas.isError ? (
            <IdeasError
              error={ideas.error}
              fallbackUrl={fallbackUrl(category, trip.destination)}
              retrying={ideas.isFetching}
              onRetry={() => void ideas.refetch()}
            />
          ) : ideas.data.ideas.length === 0 ? (
            <div className="my-3.5 grid gap-2.5 rounded-[10px] bg-sand p-3.5 text-[0.9375rem]">
              <p>
                No {category.label.toLowerCase()} found for {trip.destination}.
              </p>
              <a href={fallbackUrl(category, trip.destination)} target="_blank" rel="noopener noreferrer" className={`${linkClass} justify-self-start`}>
                Search Google Maps instead
              </a>
            </div>
          ) : (
            <ul className="grid">
              {ideas.data.ideas.map((idea) => {
                const key = `${idea.id}|${dayNumber}`
                return (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    icon={category.icon}
                    dayNumber={dayNumber}
                    added={added.has(key)}
                    adding={addingKey === key}
                    onAdd={() => add(idea)}
                  />
                )
              })}
            </ul>
          )}
        </div>
        <p className="border-t border-line px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] text-xs text-muted lg:pb-3">
          Results from Google Maps, via SerpApi.
        </p>
      </aside>
    </>
  )
}

export function IdeaCard({
  idea,
  icon,
  dayNumber,
  added,
  adding,
  onAdd,
}: {
  idea: IdeaPlace
  icon: IdeaIcon
  dayNumber: number
  added: boolean
  adding: boolean
  onAdd: () => void
}) {
  const details = [idea.type, idea.address].filter(Boolean).join(' · ')
  return (
    <li className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-t border-line py-3 first:border-t-0">
      <IdeaThumbnail url={idea.thumbnailUrl} icon={icon} />
      <div className="grid min-w-0 gap-px">
        <span className="truncate font-semibold" title={idea.name}>
          {idea.name}
        </span>
        {(idea.rating !== null || idea.priceLevel) && (
          <span className="flex items-center gap-2 text-sm tabular-nums">
            {idea.rating !== null && (
              <span>
                <span aria-hidden="true" className="text-star">
                  ★
                </span>{' '}
                <span className="sr-only">Rated </span>
                {idea.rating.toFixed(1)}
                {idea.reviews !== null && (
                  <span className="text-muted">
                    {' '}
                    ({shortCount(idea.reviews)}
                    <span className="sr-only"> reviews</span>)
                  </span>
                )}
              </span>
            )}
            {idea.priceLevel && <span className="text-muted">{idea.priceLevel}</span>}
          </span>
        )}
        {details && (
          <span className="truncate text-sm text-muted" title={details}>
            {details}
          </span>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <MapLink query={idea.address ? `${idea.name}, ${idea.address}` : idea.name} label={idea.name} />
          {added ? (
            <button
              type="button"
              disabled
              className="inline-flex min-h-9 items-center rounded-lg bg-success-soft px-3 text-sm font-medium whitespace-nowrap text-success"
            >
              ✓ Added to Day {dayNumber}
            </button>
          ) : (
            <button
              type="button"
              className={`${buttonClass.primary} min-h-9 px-3 text-sm whitespace-nowrap`}
              aria-label={`Add ${idea.name} to Day ${dayNumber}`}
              disabled={adding}
              onClick={onAdd}
            >
              {adding && <Spinner />}
              Add to Day {dayNumber}
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function IdeaThumbnail({ url, icon }: { url: string | null; icon: IdeaIcon }) {
  const [failed, setFailed] = useState(false)
  if (!url || failed) {
    return (
      <div aria-hidden="true" className="grid size-16 place-items-center rounded-lg bg-primary-soft text-primary">
        <IdeaGlyph icon={icon} size={26} />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      width={64}
      height={64}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="size-16 rounded-lg bg-line object-cover"
    />
  )
}

function IdeasSkeleton() {
  return (
    <div role="status" aria-label="Loading ideas" className="grid">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-3">
          <Skeleton className="size-16" />
          <div className="grid content-start gap-2 pt-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

function IdeasError({
  error,
  fallbackUrl,
  retrying,
  onRetry,
}: {
  error: unknown
  fallbackUrl: string
  retrying: boolean
  onRetry: () => void
}) {
  const code = error instanceof ApiError ? error.code : ''
  const message =
    code === 'IDEAS_DAILY_LIMIT'
      ? "You've looked up 20 new idea lists today. Saved lists still work; new ones are back tomorrow."
      : code === 'IDEAS_UNAVAILABLE'
        ? "Ideas aren't available right now. This usually means this month's free searches are used up."
        : "Ideas couldn't be loaded. Check your connection and try again."
  return (
    <div role="alert" className="my-3.5 grid gap-2.5 rounded-[10px] bg-warn-soft p-3.5 text-[0.9375rem] text-warn-ink">
      <p>{message}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-current px-3 text-sm font-medium disabled:opacity-60"
        >
          {retrying && <Spinner />}
          Retry
        </button>
        <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Search Google Maps instead
        </a>
      </div>
    </div>
  )
}

function fallbackUrl(category: IdeaCategory, destination: string): string {
  return mapsSearchUrl(`${category.search} in ${destination}`)
}

function CloseIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}
