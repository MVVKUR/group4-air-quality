import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, UserRound } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useOnboarding } from '@/components/onboarding/OnboardingProvider';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/map', label: 'Map', icon: Map, end: false },
];

export function AppHeader() {
  const { profile, open: openOnboarding } = useOnboarding();
  const initial = profile?.name
    ? profile.name.trim().charAt(0).toUpperCase() || '?'
    : null;

  return (
    <header className="safe-pt sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 text-white shadow-md">
            <span className="text-[10px] font-black tracking-tight">CA</span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-950" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              ChildAir
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Live AQI
            </div>
          </div>
        </NavLink>

        {/* Top nav pill — desktop / tablet only. Mobile uses BottomTabBar. */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm md:flex dark:border-slate-800 dark:bg-slate-900/60"
        >
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60',
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openOnboarding}
            aria-label={profile ? `Edit profile (${profile.name})` : 'Set up profile'}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 sm:h-9 sm:w-9',
              'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
              'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
            )}
          >
            {initial ? (
              <span className="text-sm font-bold tracking-tight">{initial}</span>
            ) : (
              <UserRound className="h-4 w-4" />
            )}
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
