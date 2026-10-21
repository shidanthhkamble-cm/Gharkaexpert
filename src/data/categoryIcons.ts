import { TradeCategory } from '../types';

import mason3d from '../assets/images/mason_3d_icon_1786171742475.jpg';
import plumber3d from '../assets/images/plumber_3d_icon_1786171757532.jpg';
import carpenter3d from '../assets/images/carpenter_3d_icon_1786171775541.jpg';
import painter3d from '../assets/images/painter_3d_icon_1786171789395.jpg';
import electrician3d from '../assets/images/electrician_3d_icon_1786171803821.jpg';
import tiles3d from '../assets/images/tiles_3d_icon_1786171821064.jpg';
import helper3d from '../assets/images/labor_3d_icon_1786171838175.jpg';
import ac3d from '../assets/images/ac_3d_icon_1786171852123.jpg';
import appliance3d from '../assets/images/appliance_3d_icon_1786171870566.jpg';
import bike3d from '../assets/images/bike_3d_icon_1786171886796.jpg';
import car3d from '../assets/images/car_3d_icon_1786171899437.jpg';
import autoRickshaw3d from '../assets/images/auto_rickshaw_3d_1792488058253.jpg';
import truck3d from '../assets/images/truck_3d_icon_1786171913021.jpg';

export const CATEGORY_3D_ICONS: Record<TradeCategory, string> = {
  mason: mason3d,
  plumber: plumber3d,
  carpenter: carpenter3d,
  painter: painter3d,
  electrician: electrician3d,
  tiles: tiles3d,
  helper: helper3d,
  ac_repair: ac3d,
  appliance_repair: appliance3d,
  bike_mechanic: bike3d,
  car_mechanic: car3d,
  auto_mechanic: autoRickshaw3d,
  truck_mechanic: truck3d,
};

// Custom external storage links (e.g. cloud storage / CDN URLs)
export const CUSTOM_CATEGORY_STORAGE_URLS: Partial<Record<TradeCategory, string>> = {
  auto_mechanic: 'https://your-storage-link.com/icons/auto_rickshaw_3d.png',
};

/**
 * Returns primary 3D icon URL for category.
 * If user has supplied an external iconUrl (like https://your-storage-link.com/icons/auto_rickshaw_3d.png),
 * it returns that URL, with local 3D asset as verified fallback.
 */
export function getCategory3DIcon(category: TradeCategory, useLocalOnly = false): string {
  if (useLocalOnly) {
    return CATEGORY_3D_ICONS[category] || mason3d;
  }
  return CUSTOM_CATEGORY_STORAGE_URLS[category] || CATEGORY_3D_ICONS[category] || mason3d;
}

/**
 * High-res bundled local 3D asset guarantee
 */
export function getCategoryFallback3DIcon(category: TradeCategory): string {
  return CATEGORY_3D_ICONS[category] || mason3d;
}
