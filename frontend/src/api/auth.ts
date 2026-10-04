import type { User } from '../types'
import { api } from './client'

export interface Credentials {
  username: string
  password: string
}

export const authApi = {
  signup: (body: Credentials) => api.post<{ user: User }>('/auth/signup', body).then((r) => r.user),
  login: (body: Credentials) => api.post<{ user: User }>('/auth/login', body).then((r) => r.user),
  logout: () => api.post<void>('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.user),
}
