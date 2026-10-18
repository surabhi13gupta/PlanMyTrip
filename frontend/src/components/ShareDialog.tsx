import { useEffect, useId, useRef, useState } from 'react'
import { useShareMutations } from '../hooks/useTrips'
import { toastError } from '../lib/errors'
import type { TripDetail } from '../types'
import { Spinner } from './Icons'
import { buttonClass, iconButtonClass, inputClass, linkClass } from './ui'

/** The address someone else opens to see the read-only trip. */
function shareUrl(shareToken: string): string {
  return `${window.location.origin}/s/${shareToken}`
}

/**
 * "Share this trip": create, copy, share, open, or turn off the read-only link
 * (frontend-spec.md §4.5.4, US13). A native <dialog>, like ConfirmDialog.
 */
export function ShareDialog({ trip, open, onClose }: { trip: TripDetail; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const { share, unshare } = useShareMutations(trip.id)
  const [copied, setCopied] = useState(false)
  const [confirmingOff, setConfirmingOff] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close?.()
  }, [open])

  const close = () => {
    setConfirmingOff(false)
    onClose()
  }

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const link = trip.shareToken ? shareUrl(trip.shareToken) : null
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      // Clipboard blocked: select the text so it can be copied by hand.
      inputRef.current?.select()
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault() // Escape: let React state close it
        close()
      }}
      className="m-auto w-[min(30rem,calc(100%-2rem))] rounded-[10px] border border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-ink/45"
    >
      {open && (
        <div className="grid gap-4">
          <div className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="text-xl font-semibold text-primary">
              Share this trip
            </h2>
            <button type="button" className={`${iconButtonClass} -mt-2 -mr-2`} aria-label="Close" onClick={close}>
              <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>

          {!link ? (
            <>
              <p className="text-muted">
                Anyone with the link can see this trip's plan and download it as a PDF. They can't change
                anything, and they won't see your name.
              </p>
              <div>
                <button
                  type="button"
                  className={buttonClass.primary}
                  disabled={share.isPending}
                  onClick={() => share.mutate(undefined, { onError: toastError })}
                >
                  {share.isPending && <Spinner />}
                  Create link
                </button>
              </div>
            </>
          ) : confirmingOff ? (
            <div className="grid gap-3 rounded-lg bg-sand p-4">
              <p>Turn off this link? Anyone who has it won't be able to open the trip any more.</p>
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" className={buttonClass.secondary} onClick={() => setConfirmingOff(false)}>
                  Keep
                </button>
                <button
                  type="button"
                  className={buttonClass.dangerSolid}
                  disabled={unshare.isPending}
                  onClick={() =>
                    unshare.mutate(undefined, {
                      onSuccess: () => setConfirmingOff(false),
                      onError: toastError,
                    })
                  }
                >
                  {unshare.isPending && <Spinner />}
                  Turn off
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted">Anyone with this link can view the trip. They can't change anything.</p>
              <div className="flex gap-2">
                <label htmlFor={`${titleId}-link`} className="sr-only">
                  Share link
                </label>
                <input
                  ref={inputRef}
                  id={`${titleId}-link`}
                  readOnly
                  value={link}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`${inputClass} min-w-0 flex-1 text-sm`}
                />
                <button type="button" className={`${buttonClass.primary} shrink-0`} onClick={() => void copy()}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {canNativeShare && (
                  <button
                    type="button"
                    className={buttonClass.secondary}
                    onClick={() =>
                      void navigator.share({ title: `Trip to ${trip.destination}`, url: link }).catch(() => {})
                    }
                  >
                    Share…
                  </button>
                )}
                <a href={link} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  Open
                </a>
                <button
                  type="button"
                  className="ml-auto min-h-11 rounded-lg px-2 text-[0.9375rem] font-medium text-danger hover:bg-danger/10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => setConfirmingOff(true)}
                >
                  Turn off link
                </button>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <button type="button" className={buttonClass.secondary} onClick={close}>
              Done
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
