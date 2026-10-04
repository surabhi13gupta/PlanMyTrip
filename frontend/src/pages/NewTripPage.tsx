import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { TripForm } from '../components/TripForm'
import { useCreateTrip } from '../hooks/useTrips'

/**
 * "Plan a new trip" (US3; mockup "New trip screen"). Not saved automatically if the page closes:
 * a half-filled new trip isn't created (frontend-spec.md §12).
 */
export default function NewTripPage() {
  const create = useCreateTrip()
  const navigate = useNavigate()

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold text-primary">Plan a new trip</h1>
      <TripForm
        submitLabel="Plan"
        onCancel={() => navigate('/trips')}
        onSubmit={async (values) => {
          const trip = await create.mutateAsync(values)
          toast.success('Trip added')
          navigate(`/trips/${trip.id}`)
        }}
      />
    </div>
  )
}
