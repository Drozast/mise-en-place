import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 border border-border dark:border-gray-700 rounded-xl shadow-sm transition-colors', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('p-6 border-b border-border dark:border-gray-700', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h2 className={cn('text-xl font-bold text-text-primary dark:text-white font-heading', className)}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className }: CardProps) {
  return (
    <div className={cn('p-6 text-text-primary dark:text-gray-200', className)}>
      {children}
    </div>
  );
}
