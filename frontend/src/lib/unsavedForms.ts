// Saving the last edit when the page closes (frontend-spec.md §12).
// Open forms register a function that returns the request to send if the page closes now,
// or null when there's nothing valid to save. On `pagehide`, every pending request is sent
// with `keepalive`, so it completes even though the page is gone.
import { sendKeepalive } from '../api/client'

export interface PendingSave {
  method: 'POST' | 'PATCH'
  path: string
  body: unknown
}

type PendingGetter = () => PendingSave | null

const registry = new Map<string, PendingGetter>()

export function registerUnsavedForm(key: string, getPending: PendingGetter): () => void {
  registry.set(key, getPending)
  return () => {
    if (registry.get(key) === getPending) registry.delete(key)
  }
}

export function collectPendingSaves(): PendingSave[] {
  const saves: PendingSave[] = []
  for (const getPending of registry.values()) {
    const pending = getPending()
    if (pending) saves.push(pending)
  }
  return saves
}

export function flushUnsavedForms(): void {
  for (const save of collectPendingSaves()) sendKeepalive(save.method, save.path, save.body)
}

export function installPagehideFlush(): () => void {
  window.addEventListener('pagehide', flushUnsavedForms)
  return () => window.removeEventListener('pagehide', flushUnsavedForms)
}
