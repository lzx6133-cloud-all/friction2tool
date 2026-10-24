import { useEffect } from 'react';
import type { ToastMessage } from '../types';
import { AlertIcon, CheckIcon, CloseIcon, SparkIcon } from './Icons';

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isError = toast.kind === 'error';
  const isSuccess = toast.kind === 'success';

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
      role="status"
      aria-live="polite"
    >
      <div
        className={`animate-slide-up flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-float ${
          isError
            ? 'border-danger/25 bg-[#fff3ef] text-danger'
            : 'border-[#c6d2ba] bg-[#f7faf3] text-[#405638]'
        }`}
      >
        <span className="mt-0.5 shrink-0">
          {isError ? (
            <AlertIcon size={16} />
          ) : isSuccess ? (
            <CheckIcon size={16} />
          ) : (
            <SparkIcon size={16} />
          )}
        </span>
        <p className="min-w-0 flex-1 text-xs leading-relaxed">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded text-current/60 transition-colors hover:bg-black/5 hover:text-current"
          aria-label="关闭提示"
        >
          <CloseIcon size={13} />
        </button>
      </div>
    </div>
  );
}
