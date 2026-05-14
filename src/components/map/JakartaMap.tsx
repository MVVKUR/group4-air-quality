import { useCallback, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  JAKARTA_BOUNDS,
  JAKARTA_CENTER,
  JAKARTA_DEFAULT_ZOOM,
  TILE_LAYERS,
  type TileLayerKey,
} from '@/lib/constants';
import { buildAqiDivIcon } from './markerIcon';
import { StationPopup } from './StationPopup';
import { MapLegend } from './MapLegend';
import { MapControls } from './MapControls';
import type { NormalizedStation } from '@/types/waqi';

interface JakartaMapProps {
  stations: NormalizedStation[];
}

export function JakartaMap({ stations }: JakartaMapProps) {
  const [layer, setLayer] = useState<TileLayerKey>('street');

  /**
   * Hold the live `L.Marker` for every station so external triggers (search
   * result click, locate-me) can open its popup imperatively via the safe
   * `marker.openPopup()` API. We deliberately *don't* hold `L.Popup` refs —
   * a closed popup has no `_map`, so calling `popup.openOn(popup._map)` blows
   * up with "Cannot read properties of undefined (reading 'hasLayer')".
   */
  const markerRefs = useRef(new Map<number, L.Marker>());

  const peakStation = useMemo(() => {
    return stations.reduce<NormalizedStation | null>((acc, s) => {
      if (s.aqi === null) return acc;
      if (!acc || (acc.aqi ?? -1) < s.aqi) return s;
      return acc;
    }, null);
  }, [stations]);

  const handleSelectStation = useCallback((s: NormalizedStation) => {
    const marker = markerRefs.current.get(s.uid);
    marker?.openPopup();
  }, []);

  return (
    <div className="relative h-[calc(100dvh-220px)] min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-slate-800 sm:rounded-3xl sm:min-h-[520px]">
      <MapContainer
        center={JAKARTA_CENTER}
        zoom={JAKARTA_DEFAULT_ZOOM}
        minZoom={9}
        maxZoom={18}
        maxBounds={JAKARTA_BOUNDS}
        maxBoundsViscosity={0.6}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          key={layer}
          url={TILE_LAYERS[layer].url}
          attribution={TILE_LAYERS[layer].attribution}
          maxZoom={TILE_LAYERS[layer].maxZoom}
        />
        {stations.map((station) => {
          const isPeak = peakStation?.uid === station.uid;
          const icon = buildAqiDivIcon(station.aqi, { pulse: isPeak });
          return (
            <Marker
              key={station.uid}
              position={[station.lat, station.lon]}
              icon={icon}
              ref={(instance) => {
                if (instance) {
                  markerRefs.current.set(station.uid, instance);
                } else {
                  // ref cleanup on unmount — keep the map tidy
                  markerRefs.current.delete(station.uid);
                }
              }}
            >
              <Popup closeButton={false} offset={[0, -4]}>
                <StationPopup station={station} />
              </Popup>
            </Marker>
          );
        })}

        <MapControls
          layer={layer}
          onLayerChange={setLayer}
          stations={stations}
          onSelectStation={handleSelectStation}
        />
      </MapContainer>

      <MapLegend className="absolute bottom-3 right-3 z-[400] sm:bottom-4 sm:right-4" />
    </div>
  );
}
