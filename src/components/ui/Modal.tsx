import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { durations, spring } from '../../lib/motion';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  // Simpan onClose terbaru tanpa memasang ulang listener setiap render.
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };

    panelRef.current?.focus();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.base }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="w-full max-w-md rounded-card bg-surface p-6 shadow-card outline-none"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={spring}
          >
            <h2 id={titleId} className="mb-3 text-xl font-bold text-ink">
              {title}
            </h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
