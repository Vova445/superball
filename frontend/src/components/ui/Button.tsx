import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-megaball-purple to-megaball-cyan text-megaball-dark font-orbitron font-bold uppercase tracking-wider hover:shadow-neon-cyan disabled:opacity-50',
  secondary:
    'border-2 border-megaball-cyan bg-transparent text-megaball-cyan font-orbitron font-bold uppercase tracking-wider hover:bg-megaball-cyan/10 hover:shadow-neon-cyan disabled:opacity-50',
  ghost:
    'border border-megaball-border bg-transparent text-white/70 font-rajdhani hover:border-megaball-purple hover:text-white hover:shadow-neon-purple disabled:opacity-50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-arcade',
  md: 'px-4 py-2.5 text-sm rounded-arcade',
  lg: 'px-6 py-3 text-sm rounded-arcade-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      className,
      type = 'button',
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-megaball-cyan',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);

Button.displayName = 'Button';
