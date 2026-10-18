import type {
  Activity,
  ActivityInput,
  IdeasResponse,
  ShareInfo,
  SharedTrip,
  Trip,
  TripDetail,
  TripInput,
} from '../types'
import { api } from './client'

export const tripPaths = {
  trip: (tripId: string) => `/trips/${tripId}`,
  activities: (tripId: string) => `/trips/${tripId}/activities`,
  activity: (tripId: string, activityId: string) => `/trips/${tripId}/activities/${activityId}`,
  ideas: (tripId: string, category: string) =>
    `/trips/${tripId}/ideas?category=${encodeURIComponent(category)}`,
  share: (tripId: string) => `/trips/${tripId}/share`,
  shared: (shareToken: string) => `/shared/${encodeURIComponent(shareToken)}`,
}

export type TripUpdate = Partial<TripInput> & { confirmDeleteActivities?: boolean }

export const tripsApi = {
  list: () => api.get<{ trips: Trip[] }>('/trips').then((r) => r.trips),
  get: (tripId: string) => api.get<TripDetail>(tripPaths.trip(tripId)),
  create: (body: TripInput) => api.post<TripDetail>('/trips', body),
  update: (tripId: string, body: TripUpdate) => api.patch<TripDetail>(tripPaths.trip(tripId), body),
  remove: (tripId: string) => api.delete(tripPaths.trip(tripId)),

  addActivity: (tripId: string, body: ActivityInput & { dayNumber: number }) =>
    api.post<Activity>(tripPaths.activities(tripId), body),
  updateActivity: (tripId: string, activityId: string, body: Partial<ActivityInput>) =>
    api.patch<Activity>(tripPaths.activity(tripId, activityId), body),
  removeActivity: (tripId: string, activityId: string) =>
    api.delete(tripPaths.activity(tripId, activityId)),

  ideas: (tripId: string, category: string) =>
    api.get<IdeasResponse>(tripPaths.ideas(tripId, category)),

  share: (tripId: string) => api.post<ShareInfo>(tripPaths.share(tripId)),
  unshare: (tripId: string) => api.delete(tripPaths.share(tripId)),
  // Public: no login needed (US13).
  shared: (shareToken: string) => api.get<SharedTrip>(tripPaths.shared(shareToken)),
}
