/** Only follow ?redirect= targets inside this app, never to another site. */
export function safeRedirect(target: string | null): string {
  if (target && target.startsWith('/') && !target.startsWith('//')) return target
  return '/trips'
}
