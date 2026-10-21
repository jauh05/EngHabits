import { useId, type InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, id, className = '', ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={hint ? hintId : undefined}
        className={`min-h-11 rounded-2xl border border-line bg-surface px-4 text-base text-ink transition-[border-color,box-shadow] outline-none placeholder:text-muted focus:border-primary-500 focus:shadow-[0_0_0_4px_var(--primary-100)] ${className}`}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
