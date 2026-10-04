import { useEffect, useId, useRef } from 'react'
import { Spinner } from './Icons'
import { buttonClass } from './ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
  busy?: boolean
}

/**
 * Confirmation using the native <dialog>: it traps focus while open, returns focus afterwards,
 * and closes on Escape (frontend-spec.md §11).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive = false,
  busy = false,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const messageId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal?.()
    if (!open && dialog.open) dialog.close?.()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => {
        e.preventDefault() // Escape: let React state close it
        if (!busy) onCancel()
      }}
      className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-[10px] border border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-ink/45"
    >
      {open && (
        <div className="grid gap-3">
          <h2 id={titleId} className="text-xl font-semibold text-primary">
            {title}
          </h2>
          <p id={messageId}>{message}</p>
          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <button type="button" className={buttonClass.secondary} onClick={onCancel} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className={destructive ? buttonClass.dangerSolid : buttonClass.primary}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy && <Spinner />}
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
