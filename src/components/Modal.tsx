import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  onClose,
  eyebrow,
  title,
  children,
  maxWidthClass = 'max-w-xl',
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    openedAtRef.current = Date.now();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 30);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        // Ignore the tail of the opening tap on touch devices so the dialog
        // does not flash open and immediately close.
        if (Date.now() - openedAtRef.current < 300) return;
        onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`animate-slide-up my-auto flex max-h-[calc(100dvh-1.5rem)] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-ink/15 bg-surface shadow-float outline-none`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line/90 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="truncate text-lg font-semibold tracking-[-0.02em] text-ink"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-transparent text-muted transition-colors hover:border-line hover:bg-white hover:text-ink"
            aria-label="关闭"
          >
            <CloseIcon size={17} />
          </button>
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
