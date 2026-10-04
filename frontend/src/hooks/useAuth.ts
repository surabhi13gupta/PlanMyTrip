import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi, type Credentials } from '../api/auth'
import { ApiError } from '../api/client'
import { clearTabLogin, hasTabLogin, markTabLoggedIn } from '../lib/tabSession'
import { queryKeys } from '../queryClient'
import type { User } from '../types'

/**
 * Startup (frontend-spec.md §8):
 * - no tab marker → a fresh visit after the page closed (or a new tab): end any old session;
 * - marker present → a refresh: ask the server who is logged in.
 */
export async function loadSession(): Promise<User | null> {
  if (!hasTabLogin()) {
    await authApi.logout().catch(() => {})
    return null
  }
  try {
    return await authApi.me()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearTabLogin()
      return null
    }
    throw error
  }
}

export function useAuth() {
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: loadSession,
    staleTime: Infinity,
    gcTime: Infinity,
  })
  return { user: query.data ?? null, isLoading: query.isPending, error: query.error }
}

function useLoggedIn() {
  const queryClient = useQueryClient()
  return (user: User) => {
    markTabLoggedIn()
    queryClient.setQueryData(queryKeys.me, user)
  }
}

export function useLogin() {
  const loggedIn = useLoggedIn()
  return useMutation({
    mutationFn: (body: Credentials) => authApi.login(body),
    onSuccess: loggedIn,
  })
}

export function useSignup() {
  const loggedIn = useLoggedIn()
  return useMutation({
    mutationFn: (body: Credentials) => authApi.signup(body),
    onSuccess: loggedIn,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearTabLogin()
      queryClient.clear()
      queryClient.setQueryData(queryKeys.me, null)
    },
  })
}
