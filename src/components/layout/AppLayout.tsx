import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { BottomTabBar } from './BottomTabBar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader />
      <main className="pb-with-tabbar mx-auto w-full max-w-6xl flex-1 px-4 pt-4 sm:px-6 sm:pt-6 sm:pb-12">
        {children}
      </main>
      <div className="hidden md:block">
        <AppFooter />
      </div>
      <BottomTabBar />
    </div>
  );
}
