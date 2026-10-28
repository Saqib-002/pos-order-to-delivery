import {
  GeocodeHit,
  normalizeAddressKey,
  geocodeAddressDetailed,
} from "@/renderer/utils/googleMaps";
import { formatAddressForGeocoding } from "@/renderer/utils/utils";

// Shared geocode cache in the local database: an address found once by any POS
// is reused by all of them instead of being looked up online again.

const api = () => (window as any).electronAPI;

export const getAddressCacheKey = normalizeAddressKey;

const toHit = (e: any): GeocodeHit => ({
  lat: Number(e.lat),
  lng: Number(e.lng),
  source: e.source || "cartociudad",
  precision: e.precision || "unknown",
  postcode: e.resultPostcode ?? null,
});

export const loadCachedCoordinates = async (
  token: string | null,
  addressKeys: string[]
): Promise<Map<string, GeocodeHit>> => {
  const result = new Map<string, GeocodeHit>();
  if (addressKeys.length === 0) return result;
  try {
    const res = await api().getGeocodeCache(token, addressKeys);
    if (res?.status && Array.isArray(res.data)) {
      for (const e of res.data) result.set(e.addressKey, toHit(e));
    }
  } catch (err) {
    console.warn("Failed to read shared geocode cache:", err);
  }
  return result;
};

export const saveCachedCoordinates = async (
  token: string | null,
  entries: { addressKey: string; hit: GeocodeHit }[]
) => {
  if (entries.length === 0) return;
  try {
    await api().saveGeocodeCache(
      token,
      entries.map(({ addressKey, hit }) => ({
        addressKey,
        lat: hit.lat,
        lng: hit.lng,
        source: hit.source,
        precision: hit.precision,
        resultPostcode: hit.postcode,
      }))
    );
  } catch (err) {
    console.warn("Failed to save shared geocode cache:", err);
  }
};

// Location placed by a user on the map; overrides automatic lookups on every POS
export const saveManualLocation = async (
  token: string | null,
  addressKey: string,
  lat: number,
  lng: number
): Promise<boolean> => {
  try {
    const res = await api().setManualGeocode(token, addressKey, lat, lng);
    return !!res?.status;
  } catch (err) {
    console.warn("Failed to save manual location:", err);
    return false;
  }
};

// "Look up again": removes the stored location so the next load asks online
export const deleteCachedLocation = async (
  token: string | null,
  addressKey: string
): Promise<boolean> => {
  try {
    const res = await api().deleteGeocodeCacheEntry(token, addressKey);
    return !!res?.status;
  } catch (err) {
    console.warn("Failed to delete cached location:", err);
    return false;
  }
};

// Reserves the next shared Nominatim request slot; resolves to the wait in ms
export const reserveNominatimSlot = async (
  token: string | null,
  intervalMs: number
): Promise<number> => {
  const res = await api().reserveGeocodeSlot(token, "nominatim", intervalMs);
  if (!res?.status) throw new Error(res?.error || "Slot reservation failed");
  return Number(res.data) || 0;
};

// Location of one delivery address, looked up exactly like the radar does:
// apartment / flat details stripped, shared DB cache first (so anything the
// radar or another POS already found is reused), otherwise looked up online
// and saved to the cache. Pass the order's original address (structured or
// plain text), not the display-formatted one, so the apartment can be removed.
export const locateDeliveryAddress = async (
  token: string | null,
  rawAddress: string
): Promise<{ lat: number; lng: number } | null> => {
  const lookupText = formatAddressForGeocoding(rawAddress || "");
  if (!lookupText.trim()) return null;
  const addressKey = getAddressCacheKey(lookupText);

  if (token) {
    const cached = (await loadCachedCoordinates(token, [addressKey])).get(addressKey);
    if (cached) return { lat: cached.lat, lng: cached.lng };
  }

  const { hit } = await geocodeAddressDetailed(lookupText);
  if (!hit) return null;
  if (token) saveCachedCoordinates(token, [{ addressKey, hit }]);
  return { lat: hit.lat, lng: hit.lng };
};
