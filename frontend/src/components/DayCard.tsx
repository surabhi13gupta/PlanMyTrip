import { useState } from 'react'
import { tripPaths } from '../api/trips'
import { useActivityMutations } from '../hooks/useTrips'
import { activitiesForDay } from '../lib/activities'
import { formatDayLabel } from '../lib/dates'
import { toastError } from '../lib/errors'
import { activityToValues, toActivityInput } from '../lib/schemas'
import type { Activity, TripDay } from '../types'
import { ActivityForm } from './ActivityForm'
import { ConfirmDialog } from './ConfirmDialog'
import { EditIcon, TrashIcon } from './Icons'
import { buttonClass, cardClass, iconButtonClass } from './ui'

interface DayCardProps {
  tripId: string
  day: TripDay
  activities: Activity[]
}

/** One day of the plan: heading, its activities in order, and "+ Add activity" (frontend-spec.md §4.5). */
export function DayCard({ tripId, day, activities }: DayCardProps) {
  const mutations = useActivityMutations(tripId)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Activity | null>(null)
  const items = activitiesForDay(activities, day.dayNumber)
  const headingId = `day-${day.dayNumber}-heading`

  return (
    <section
      id={`day-${day.dayNumber}`}
      aria-labelledby={headingId}
      className={`${cardClass} grid scroll-mt-24 gap-3 p-[18px]`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-lg font-semibold text-primary">
          Day {day.dayNumber}
        </h2>
        <span className="text-[0.9375rem] text-muted">{formatDayLabel(day.date)}</span>
      </div>

      {items.length === 0 && !adding && <p className="text-muted italic">No activities planned</p>}

      {items.length > 0 && (
        <ul className="grid">
          {items.map((activity) =>
            editingId === activity.id ? (
              <li key={activity.id} className="py-2">
                <ActivityForm
                  formKey={`edit-${activity.id}`}
                  defaultValues={activityToValues(activity)}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    await mutations.update.mutateAsync({
                      activityId: activity.id,
                      body: toActivityInput(values),
                    })
                    setEditingId(null)
                  }}
                  toPendingSave={(values) => ({
                    method: 'PATCH',
                    path: tripPaths.activity(tripId, activity.id),
                    body: toActivityInput(values),
                  })}
                />
              </li>
            ) : (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onEdit={() => setEditingId(activity.id)}
                onDelete={() => setDeleting(activity)}
              />
            ),
          )}
        </ul>
      )}

      {adding ? (
        <ActivityForm
          formKey={`add-${tripId}-day-${day.dayNumber}`}
          submitLabel="Save"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await mutations.add.mutateAsync({ dayNumber: day.dayNumber, ...toActivityInput(values) })
            setAdding(false)
          }}
          toPendingSave={(values) => ({
            method: 'POST',
            path: tripPaths.activities(tripId),
            body: { dayNumber: day.dayNumber, ...toActivityInput(values) },
          })}
        />
      ) : (
        <div>
          <button type="button" className={buttonClass.ghost} onClick={() => setAdding(true)}>
            + Add activity
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete activity?"
        message={deleting ? `Delete "${deleting.title}"?` : ''}
        confirmLabel="Delete"
        destructive
        busy={mutations.remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return
          mutations.remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
            onError: (error) => {
              setDeleting(null)
              toastError(error)
            },
          })
        }}
      />
    </section>
  )
}

export function ActivityItem({
  activity,
  onEdit,
  onDelete,
}: {
  activity: Activity
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-start gap-3 border-t border-line py-3 first:border-t-0">
      <span className={activity.time ? 'font-medium text-primary tabular-nums' : 'text-muted'}>
        {activity.time ?? 'No time'}
      </span>
      <div className="grid min-w-0 gap-0.5">
        <span className="font-medium break-words">{activity.title}</span>
        {activity.notes && (
          <span className="text-[0.9375rem] break-words whitespace-pre-line text-muted">{activity.notes}</span>
        )}
      </div>
      <div className="-my-2 flex">
        <button type="button" className={iconButtonClass} aria-label={`Edit ${activity.title}`} onClick={onEdit}>
          <EditIcon />
        </button>
        <button
          type="button"
          className={`${iconButtonClass} hover:bg-danger/10 hover:text-danger`}
          aria-label={`Delete ${activity.title}`}
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  )
}
