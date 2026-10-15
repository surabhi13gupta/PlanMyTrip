import type { User } from '../types'

/** The first word of the name ("Surabhi Gupta" → "Surabhi"), or the username if there's no name. */
export function greetingName(user: Pick<User, 'name' | 'username'>): string {
  const first = user.name?.trim().split(/\s+/)[0]
  return first || user.username
}

/** What the banner shows next to Log out: the full name, or the username if there's no name. */
export function displayName(user: Pick<User, 'name' | 'username'>): string {
  return user.name?.trim() || user.username
}
