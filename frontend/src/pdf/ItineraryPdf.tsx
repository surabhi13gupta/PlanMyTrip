import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import fira400 from '@fontsource/fira-sans/files/fira-sans-latin-400-normal.woff?url'
import fira500 from '@fontsource/fira-sans/files/fira-sans-latin-500-normal.woff?url'
import fira600 from '@fontsource/fira-sans/files/fira-sans-latin-600-normal.woff?url'
import { activitiesForDay } from '../lib/activities'
import { formatDateRange, formatDayLabel, formatDuration, getTripDays } from '../lib/dates'
import { TRIP_TYPES, type TripDetail } from '../types'

// The PDF uses the app's font and dark blue (frontend-spec.md §2). react-pdf can't read the
// page's web fonts, so the same font files are registered with it here.
Font.register({
  family: 'Fira Sans',
  fonts: [
    { src: fira400, fontWeight: 400 },
    { src: fira500, fontWeight: 500 },
    { src: fira600, fontWeight: 600 },
  ],
})
Font.registerHyphenationCallback((word) => [word]) // don't split words across lines

const color = { primary: '#1E3A5F', ink: '#1E293B', muted: '#6B5E4E', line: '#E5D9C8', soft: '#E3EAF3' }

const styles = StyleSheet.create({
  page: { fontFamily: 'Fira Sans', fontSize: 11, color: color.ink, padding: 40, lineHeight: 1.4 },
  brand: { fontSize: 9, fontWeight: 500, color: color.muted, letterSpacing: 1, marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 600, color: color.primary },
  meta: { fontSize: 11, color: color.muted, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: color.soft,
    color: color.primary,
    fontSize: 9,
    fontWeight: 500,
  },
  header: { marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: color.line },
  day: { marginBottom: 14 },
  dayHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: color.line,
  },
  dayTitle: { fontSize: 13, fontWeight: 600, color: color.primary },
  dayDate: { fontSize: 11, color: color.muted },
  activity: { flexDirection: 'row', paddingVertical: 4 },
  time: { width: 52, fontWeight: 500, color: color.primary },
  noTime: { width: 52, color: color.muted },
  body: { flex: 1 },
  activityTitle: { fontWeight: 500 },
  notes: { color: color.muted, fontSize: 10, marginTop: 1 },
  empty: { color: color.muted, fontStyle: 'italic', paddingVertical: 4 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 8, color: color.muted, textAlign: 'right' },
})

/** The printable itinerary: trip details, then every day with its activities (US6). */
export function ItineraryPdf({ trip }: { trip: TripDetail }) {
  const tripType = TRIP_TYPES.find((t) => t.value === trip.tripType)?.label ?? trip.tripType
  return (
    <Document title={`${trip.destination} itinerary`} author="PlanMyTrip" creator="PlanMyTrip">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>PLANMYTRIP · ITINERARY</Text>
          <Text style={styles.title}>{trip.destination}</Text>
          <Text style={styles.meta}>
            {formatDateRange(trip.startDate, trip.endDate)} · {formatDuration(trip.durationDays)}
          </Text>
          <Text style={styles.badge}>{tripType}</Text>
        </View>

        {getTripDays(trip.startDate, trip.endDate).map((day) => {
          const items = activitiesForDay(trip.activities, day.dayNumber)
          return (
            <View key={day.dayNumber} style={styles.day} wrap={items.length > 6}>
              <View style={styles.dayHeading}>
                <Text style={styles.dayTitle}>Day {day.dayNumber}</Text>
                <Text style={styles.dayDate}>{formatDayLabel(day.date)}</Text>
              </View>
              {items.length === 0 ? (
                <Text style={styles.empty}>No activities planned</Text>
              ) : (
                items.map((activity) => (
                  <View key={activity.id} style={styles.activity} wrap={false}>
                    <Text style={activity.time ? styles.time : styles.noTime}>{activity.time ?? '—'}</Text>
                    <View style={styles.body}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      {activity.notes ? <Text style={styles.notes}>{activity.notes}</Text> : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          )
        })}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
