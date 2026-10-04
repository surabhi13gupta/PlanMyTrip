// Form rules from api-contract-spec.md §4 (the backend enforces the same ones).
import { z } from 'zod'
import { getTripDuration, isValidISODate, MAX_TRIP_DAYS, todayISO } from './dates'

export const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_]{3,30}$/, 'Use 3–30 letters, numbers, or underscores.'),
    password: z
      .string()
      .min(8, 'Password must be 8–72 characters.')
      .max(72, 'Password must be 8–72 characters.'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match.",
  })
export type SignupValues = z.infer<typeof signupSchema>

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username.'),
  password: z.string().min(1, 'Enter your password.'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const TRIP_TYPE_VALUES = ['solo', 'couple', 'family', 'friends'] as const

export interface TripSchemaOptions {
  /** When editing: the trip's saved start date. The past-date rule only applies if it changes. */
  originalStartDate?: string
  today?: string
}

export function tripSchema({ originalStartDate, today = todayISO() }: TripSchemaOptions = {}) {
  return z
    .object({
      startDate: z.string().refine(isValidISODate, 'Enter a valid start date.'),
      endDate: z.string().refine(isValidISODate, 'Enter a valid end date.'),
      destination: z
        .string()
        .trim()
        .min(1, 'Enter a destination.')
        .max(100, 'Enter a destination.'),
      tripType: z.enum(TRIP_TYPE_VALUES, { error: 'Choose a trip type.' }),
    })
    .superRefine((v, ctx) => {
      if (!isValidISODate(v.startDate) || !isValidISODate(v.endDate)) return
      if (v.startDate !== originalStartDate && v.startDate < today) {
        ctx.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: "The start date can't be in the past.",
        })
      }
      if (v.endDate < v.startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: "The end date can't be before the start date.",
        })
      } else if (getTripDuration(v.startDate, v.endDate) > MAX_TRIP_DAYS) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'A trip can be at most 14 days long.',
        })
      }
    })
}
export type TripValues = z.infer<ReturnType<typeof tripSchema>>
/** What the form holds before validation (tripType may be unset). */
export type TripFormValues = Omit<TripValues, 'tripType'> & { tripType: TripValues['tripType'] | '' }

export const activitySchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(100, 'Enter a title.'),
  time: z
    .string()
    .refine((t) => t === '' || /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t), 'Use a time like 09:30.'),
  notes: z.string().max(500, 'Notes can be at most 500 characters.'),
})
export type ActivityValues = z.infer<typeof activitySchema>

/** Form values → API body: empty optional fields are sent as null. */
export function toActivityInput(values: ActivityValues) {
  const notes = values.notes.trim()
  return { title: values.title.trim(), time: values.time || null, notes: notes || null }
}

/** API activity → form values (null becomes an empty field). */
export function activityToValues(activity: {
  title: string
  time: string | null
  notes: string | null
}): ActivityValues {
  return { title: activity.title, time: activity.time ?? '', notes: activity.notes ?? '' }
}
