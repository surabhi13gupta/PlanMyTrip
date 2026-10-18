import { Link } from 'react-router'
import { BackLink } from '../components/BackLink'
import { UserMenu } from '../components/Layouts'
import { SiteBanner } from '../components/SiteBanner'
import { SiteFooter } from '../components/SiteFooter'
import { buttonClass } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  'Plan a trip of up to 14 days: solo, as a couple, with family, or with friends.',
  'Add activities to each day, with an optional time and notes.',
  'Find ideas for your destination (top sights, museums, restaurants and more) and add them to any day.',
  'Open any activity on Google Maps for directions.',
  'Download the whole itinerary as a PDF to print or keep on your phone.',
]

const GOOD_TO_KNOW = [
  'Your trips are private to your account.',
  'PlanMyTrip is free, with no ads.',
  'Ideas come from Google Maps, via SerpApi.',
]

/** What PlanMyTrip does, for everyone, logged in or not (frontend-spec.md §4.8, US10). */
export default function AboutPage() {
  const { user } = useAuth()
  return (
    <div className="min-h-dvh">
      <SiteBanner>{user && <UserMenu />}</SiteBanner>
      <main className="mx-auto grid w-full max-w-xl gap-6 px-4 pt-6 pb-12 md:px-6">
        <div className="grid gap-2">
          <BackLink>Back</BackLink>
          <h1 className="text-2xl font-semibold text-primary">About PlanMyTrip</h1>
          <p className="text-lg">
            PlanMyTrip helps you plan a trip one day at a time, then take the plan with you as a PDF.
          </p>
        </div>

        <AboutList title="What you can do" items={FEATURES} />
        <AboutList title="Good to know" items={GOOD_TO_KNOW} />

        <div>
          {user ? (
            <Link to="/trips" className={buttonClass.primary}>
              Go to My Trips
            </Link>
          ) : (
            <Link to="/signup" className={buttonClass.primary}>
              Create a free account
            </Link>
          )}
        </div>
        <SiteFooter />
      </main>
    </div>
  )
}

function AboutList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="grid gap-2">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <ul className="grid list-disc gap-1.5 pl-5 marker:text-primary">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
