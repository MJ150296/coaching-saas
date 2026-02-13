import { ReactNode } from 'react';

type BadgeVariant =
  | 'gray'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'orange';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
};

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${VARIANT_CLASS[variant]} ${className}`}>
      {children}
    </span>
  );
}
