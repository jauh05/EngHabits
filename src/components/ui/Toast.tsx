import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { spring } from '../../lib/motion';

export type ToastTone = 'neutral' | 'success' | 'error';

type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const tones: Record<ToastTone, string> = {
  neutral: 'bg-surface text-ink border border-line',
  success: 'bg-success text-on-accent',
  error: 'bg-error text-on-accent',
};

const TOAST_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'neutral') => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, TOAST_MS);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={spring}
              className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm font-semibold shadow-card ${tones[item.tone]}`}
            >
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}
