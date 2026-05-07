import L from 'leaflet';
import { aqiHexFor, getAQICategory } from '@/lib/aqi-utils';

const MIN_RADIUS = 16;
const MAX_RADIUS = 36;

export function radiusForAqi(aqi: number | null): number {
  if (aqi === null) return MIN_RADIUS;
  const clamped = Math.max(0, Math.min(300, aqi));
  return Math.round(MIN_RADIUS + (clamped / 300) * (MAX_RADIUS - MIN_RADIUS));
}

export function buildAqiDivIcon(
  aqi: number | null,
  options: { pulse?: boolean; demo?: boolean } = {},
): L.DivIcon {
  const cat = getAQICategory(aqi);
  const radius = radiusForAqi(aqi);
  const hex = aqiHexFor(aqi);
  const display = aqi === null ? '–' : aqi;
  const textCls = cat.preferDarkText ? 'dark-text' : 'light-text';
  const pulseCls = options.pulse ? ' is-pulsing' : '';
  const dashStyle = options.demo ? 'border-style:dashed;opacity:0.85;' : '';
  const html = `
    <div class="aqi-marker ${textCls}${pulseCls}" style="width:${radius}px;height:${radius}px;background:${hex};${dashStyle}">
      <span>${display}</span>
    </div>`;
  return L.divIcon({
    html,
    className: 'aqi-marker-wrap',
    iconSize: [radius, radius],
    iconAnchor: [radius / 2, radius / 2],
    popupAnchor: [0, -radius / 2],
  });
}
