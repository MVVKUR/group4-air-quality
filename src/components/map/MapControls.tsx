import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, Locate, Search, X } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { cn } from '@/lib/cn';
import type { NormalizedStation } from '@/types/waqi';
import { useGeolocation } from '@/hooks/useGeolocation';
import { TILE_LAYERS, type TileLayerKey } from '@/lib/constants';

interface MapControlsProps {
  layer: TileLayerKey;
  onLayerChange: (layer: TileLayerKey) => void;
  stations: NormalizedStation[];
  onSelectStation: (station: NormalizedStation) => void;
}

export function MapControls({
  layer,
  onLayerChange,
  stations,
  onSelectStation,
}: MapControlsProps) {
  const map = useMap();
  const { position, locate, loading: locating } = useGeolocation();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!position) return;
    map.flyTo([position.lat, position.lon], 13, { duration: 1.2 });
    const nearest = stations.reduce(
      (acc, s) => {
        const d = (s.lat - position.lat) ** 2 + (s.lon - position.lon) ** 2;
        return !acc || d < acc.d ? { d, s } : acc;
      },
      null as { d: number; s: NormalizedStation } | null,
    );
    if (nearest) onSelectStation(nearest.s);
  }, [position, map, stations, onSelectStation]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return stations.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search, stations]);

  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 z-[450] flex items-start gap-2 sm:inset-x-4 sm:top-4">
      <div className="pointer-events-auto relative min-w-0 flex-1 sm:max-w-md">
        <div
          className={cn(
            'flex h-11 items-center gap-2 rounded-full border bg-white/95 pl-3 pr-1 shadow-lg backdrop-blur transition-all sm:h-10',
            'dark:border-slate-800 dark:bg-slate-900/90',
            searchOpen ? 'ring-2 ring-blue-500/30' : 'border-slate-200',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Search stations…"
            // 16px font prevents iOS auto-zoom on focus.
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 sm:text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                inputRef.current?.focus();
              }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800 sm:h-7 sm:w-7"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchOpen && matches.length > 0 && (
          <div className="absolute inset-x-0 top-[52px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:top-12">
            {matches.map((s) => (
              <button
                key={s.uid}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  map.flyTo([s.lat, s.lon], 14, { duration: 1.0 });
                  onSelectStation(s);
                  setSearch('');
                  setSearchOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800 sm:py-2"
              >
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {s.name}
                </span>
                <span className="tabular shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {s.aqi ?? '—'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pointer-events-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={locate}
          aria-label="Locate me"
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white/95 text-slate-700 shadow-md backdrop-blur transition hover:bg-white active:scale-95 sm:h-10 sm:w-10',
            'dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200',
            'border-slate-200',
            locating && 'animate-pulse',
          )}
        >
          <Locate className="h-[18px] w-[18px]" />
        </button>

        <LayerToggle layer={layer} onLayerChange={onLayerChange} />
      </div>
    </div>
  );
}

function LayerToggle({
  layer,
  onLayerChange,
}: {
  layer: TileLayerKey;
  onLayerChange: (layer: TileLayerKey) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Map layer"
        aria-expanded={open}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur transition hover:bg-white active:scale-95 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 sm:h-10 sm:w-10"
      >
        <Layers className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:top-11 sm:w-36"
        >
          {(Object.keys(TILE_LAYERS) as TileLayerKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="menuitemradio"
              aria-checked={key === layer}
              onClick={() => {
                onLayerChange(key);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center justify-between px-3 py-3 text-sm hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/60 dark:active:bg-slate-800 sm:py-2',
                key === layer
                  ? 'font-semibold text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-300',
              )}
            >
              {TILE_LAYERS[key].name}
              {key === layer && <span className="text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
