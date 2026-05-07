import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
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
  const [activeUid, setActiveUid] = useState<number | null>(null);
  const popupRefs = useRef(new Map<number, L.Popup>());

  const peakStation = useMemo(() => {
    return stations.reduce<NormalizedStation | null>((acc, s) => {
      if (s.aqi === null) return acc;
      if (!acc || (acc.aqi ?? -1) < s.aqi) return s;
      return acc;
    }, null);
  }, [stations]);

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
              ref={(ref) => {
                if (ref) {
                  ref.on('popupopen', () => setActiveUid(station.uid));
                  ref.on('popupclose', () =>
                    setActiveUid((u) => (u === station.uid ? null : u)),
                  );
                }
              }}
            >
              <Popup
                ref={(ref) => {
                  if (ref) popupRefs.current.set(station.uid, ref);
                }}
                closeButton={false}
                offset={[0, -4]}
              >
                <StationPopup station={station} />
              </Popup>
            </Marker>
          );
        })}

        <MapControls
          layer={layer}
          onLayerChange={setLayer}
          stations={stations}
          onSelectStation={(s) => {
            const popup = popupRefs.current.get(s.uid);
            if (popup) popup.openOn((popup as unknown as { _map: L.Map })._map);
          }}
        />

        <ProgrammaticPopup activeUid={activeUid} popupRefs={popupRefs.current} />
      </MapContainer>

      <MapLegend className="absolute bottom-3 right-3 z-[400] sm:bottom-4 sm:right-4" />
    </div>
  );
}

function ProgrammaticPopup({
  activeUid,
  popupRefs,
}: {
  activeUid: number | null;
  popupRefs: Map<number, L.Popup>;
}) {
  // Used for keyboard accessibility hooks; we just need access to map for now.
  useMap();
  useEffect(() => {
    if (activeUid === null) return;
    popupRefs.get(activeUid)?.bringToFront?.();
  }, [activeUid, popupRefs]);
  return null;
}
