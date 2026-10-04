import type { ReactNode } from 'react'
import { Spinner } from './Icons'
import { buttonClass, cardClass } from './ui'

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center text-primary">
      <Spinner label="Loading" />
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-line/70 motion-reduce:animate-none ${className}`} />
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className={`${cardClass} grid justify-items-start gap-3 p-6`}>
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <p className="text-muted">{message}</p>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className={`${cardClass} grid justify-items-start gap-3 p-6`}>
      <p>{message}</p>
      <button type="button" className={buttonClass.secondary} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
