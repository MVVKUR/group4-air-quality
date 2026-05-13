import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TabItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const TABS: TabItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/map', label: 'Map', icon: Map },
];

export function BottomTabBar() {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'safe-pb safe-px fixed inset-x-0 bottom-0 z-40 flex border-t backdrop-blur-xl md:hidden',
        'border-white/70 bg-[#fbf7ef]/88 shadow-[0_-12px_30px_rgba(120,103,82,0.10)]',
        'dark:border-slate-800 dark:bg-slate-950/90',
      )}
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'relative flex h-[64px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
              isActive
                ? 'text-[#23313a] dark:text-white'
                : 'text-slate-500 dark:text-slate-400',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform',
                  isActive && 'scale-110',
                )}
                aria-hidden
              />
              <span className="text-[11px] font-semibold tracking-wide">
                {label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 h-[3px] w-8 rounded-full bg-gradient-to-r from-[#f2ff72] via-[#c9eadf] to-[#8fb3c2]"
                  aria-hidden
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
