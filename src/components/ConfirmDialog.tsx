import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/confirm-dialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Remove',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Focus trap: cycle Tab/Shift+Tab within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onCancel],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    cancelRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return createPortal(
    <div className={`ee-dialog-overlay ${styles.overlay}`} onClick={onCancel} role="dialog" aria-modal="true" aria-label={title}>
      <div ref={dialogRef} className={`ee-dialog ${styles.dialog}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={`ee-dialog-title ${styles.title}`}>{title}</h3>
        <p className={`ee-dialog-message ${styles.message}`}>{message}</p>
        <div className={`ee-dialog-actions ${styles.actions}`}>
          <button ref={cancelRef} className={`ee-dialog-cancel ${styles.btnCancel}`} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`ee-dialog-confirm ${styles.btnConfirm}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
