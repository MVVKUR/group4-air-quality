import { ExternalLink, Wind } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200/70 bg-white/60 dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:px-6">
        <div className="text-center sm:text-left">
          Data:{' '}
          <a
            href="https://aqicn.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
          >
            World Air Quality Index Project (aqicn.org)
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          · Tiles ©{' '}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-slate-900 dark:hover:text-white"
          >
            OpenStreetMap
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">Built with Vite + React</span>
          <Wind className="h-3.5 w-3.5" aria-hidden />
        </div>
      </div>
    </footer>
  );
}
