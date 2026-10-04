// "Logged out when the page closes" (frontend-spec.md §8).
// sessionStorage belongs to one tab: it survives a refresh but is wiped when the tab closes.
// A missing marker on startup therefore means "fresh visit" → end any old session.

const MARKER = 'pmt-tab-logged-in'

export function hasTabLogin(): boolean {
  try {
    return sessionStorage.getItem(MARKER) === '1'
  } catch {
    return false // storage blocked: treat every load as a fresh visit
  }
}

export function markTabLoggedIn(): void {
  try {
    sessionStorage.setItem(MARKER, '1')
  } catch {
    // Without storage the user simply logs in again after a refresh.
  }
}

export function clearTabLogin(): void {
  try {
    sessionStorage.removeItem(MARKER)
  } catch {
    // nothing to clear
  }
}
