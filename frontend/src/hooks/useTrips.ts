import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tripsApi, type TripUpdate } from '../api/trips'
import { queryKeys } from '../queryClient'
import type { ActivityInput, TripInput } from '../types'

export function useTrips() {
  return useQuery({ queryKey: queryKeys.trips, queryFn: tripsApi.list })
}

export function useTrip(tripId: string) {
  return useQuery({ queryKey: queryKeys.trip(tripId), queryFn: () => tripsApi.get(tripId) })
}

// After any change the app refetches from the server; nothing is shown before it confirms
// (frontend-spec.md §6).

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: TripInput) => tripsApi.create(body),
    onSuccess: (trip) => {
      queryClient.setQueryData(queryKeys.trip(trip.id), trip)
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips })
    },
  })
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: TripUpdate) => tripsApi.update(tripId, body),
    onSuccess: (trip) => {
      queryClient.setQueryData(queryKeys.trip(tripId), trip)
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips })
    },
  })
}

export function useDeleteTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => tripsApi.remove(tripId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.trip(tripId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.trips })
    },
  })
}

export function useActivityMutations(tripId: string) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.trip(tripId) })
  return {
    add: useMutation({
      mutationFn: (body: ActivityInput & { dayNumber: number }) =>
        tripsApi.addActivity(tripId, body),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ activityId, body }: { activityId: string; body: Partial<ActivityInput> }) =>
        tripsApi.updateActivity(tripId, activityId, body),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (activityId: string) => tripsApi.removeActivity(tripId, activityId),
      onSuccess: refresh,
    }),
  }
}
