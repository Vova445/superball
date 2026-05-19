import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block font-rajdhani text-sm font-medium text-white/70"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-arcade border border-megaball-border bg-megaball-dark/80 px-4 py-3 font-rajdhani text-white placeholder:text-white/40 transition-all',
            'focus:border-megaball-cyan focus:outline-none focus:shadow-neon-cyan',
            error && 'border-red-500/80 focus:border-red-500 focus:shadow-[0_0_16px_rgba(239,68,68,0.3)]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm font-medium text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
