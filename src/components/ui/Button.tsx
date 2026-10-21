import { motion, type HTMLMotionProps } from 'motion/react';
import { spring } from '../../lib/motion';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg' | 'icon';

export type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: 'bg-btn-bg text-btn-fg shadow-card',
  secondary: 'bg-primary-100 text-primary-700',
  ghost: 'bg-transparent text-primary-700 hover:bg-primary-100',
};

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-base',
  lg: 'min-h-14 px-7 text-lg',
  icon: 'size-11 p-0',
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
