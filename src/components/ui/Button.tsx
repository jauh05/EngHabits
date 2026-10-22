import { motion, type HTMLMotionProps } from 'motion/react';
import { spring } from '../../lib/motion';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg' | 'icon';

export type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant;
  size?: Size;
};

/**
 * Tombol 3D: tepi di bawah (--edge) menghilang saat ditekan, dan tombol ikut turun sedikit.
 * Ghost tidak punya latar, jadi tetap datar.
 */
const variants: Record<Variant, string> = {
  primary:
    'bg-btn-bg text-btn-fg shadow-card [--edge:color-mix(in_srgb,var(--btn-bg),var(--shade)_40%)] active:translate-y-[5px] active:[--edge:transparent]',
  secondary:
    'bg-primary-100 text-primary-700 shadow-card [--edge:var(--primary-300)] active:translate-y-[3px] active:[--edge:transparent]',
  ghost: 'bg-transparent text-primary-700 hover:bg-primary-100',
};

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-base',
  lg: 'min-h-14 px-7 text-lg',
  icon: 'size-11 p-0',
};

/**
 * Kelas tombol. Dipakai juga oleh tautan yang tampil sebagai tombol (Link), karena Link tidak bisa dibungkus Button.
 */
export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = ''): string {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;
}

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
      className={buttonClass(variant, size, className)}
      {...props}
    />
  );
}
