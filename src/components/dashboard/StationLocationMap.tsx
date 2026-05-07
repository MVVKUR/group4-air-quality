import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { buildAqiDivIcon } from '@/components/map/markerIcon';
import { TILE_LAYERS } from '@/lib/constants';

interface StationLocationMapProps {
  lat: number;
  lon: number;
  aqi: number | null;
  name: string;
}

export function StationLocationMap({ lat, lon, aqi, name }: StationLocationMapProps) {
  return (
    <div className="h-56 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <MapContainer
        center={[lat, lon]}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        attributionControl={false}
        className="h-full w-full"
      >
        <TileLayer url={TILE_LAYERS.street.url} attribution={TILE_LAYERS.street.attribution} />
        <Marker position={[lat, lon]} icon={buildAqiDivIcon(aqi)} title={name} />
      </MapContainer>
    </div>
  );
}
