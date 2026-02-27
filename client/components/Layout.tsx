import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className={cn('flex-1 overflow-auto md:ml-64 pt-16 md:pt-0', className)}>
        {children}
      </main>
    </div>
  );
}
