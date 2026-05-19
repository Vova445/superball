'use client';

import { useEffect, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  showClose = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-megaball-dark/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-arcade-xl border border-megaball-border bg-megaball-surface p-6 shadow-neon-purple animate-glow',
          className
        )}
      >
        {(title || showClose) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            {title && (
              <h2
                id="modal-title"
                className="font-orbitron text-lg font-bold uppercase tracking-wide text-white"
              >
                {title}
              </h2>
            )}
            {showClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0"
              >
                ✕
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
