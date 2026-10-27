// In-memory caches to prevent duplicate network calls
const geocodeMemoryCache = new Map<string, GeocodeHit | null>();
const distanceMemoryCache = new Map<string, number>();

// FOSSGIS OSRM instance (HTTPS, real car/bike profiles — the project-osrm.org
// demo server only routes cars and ignores the profile segment)
export const getOsrmBaseUrl = (profile: "car" | "bike" = "car") =>
  `https://routing.openstreetmap.de/routed-${profile}`;

export const calculateDistance = async (
  origin: string | { lat: number; lng: number },
  destination: string | { lat: number; lng: number },
  apiKey?: string
): Promise<number | null> => {
  if (!origin || !destination) return null;

  const originKey = typeof origin === "string" ? origin : `${origin.lat},${origin.lng}`;
  const destKey = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`;
  const cacheKey = `${originKey.toLowerCase()}_to_${destKey.toLowerCase()}`;
  if (distanceMemoryCache.has(cacheKey)) {
    return distanceMemoryCache.get(cacheKey)!;
  }

  try {
    // 1. Resolve coordinates for origin and destination
    const [origCoords, destCoords] = await Promise.all([
      typeof origin === "object" && "lat" in origin
        ? Promise.resolve(origin)
        : geocodeAddress(origin, apiKey || ""),
      typeof destination === "object" && "lat" in destination
        ? Promise.resolve(destination)
        : geocodeAddress(destination, apiKey || ""),
    ]);

    if (origCoords && destCoords) {
      // 2. Query OSRM Table Service (100% Free Open Source Routing)
      try {
        const osrmUrl = `${getOsrmBaseUrl("car")}/table/v1/driving/${origCoords.lng},${origCoords.lat};${destCoords.lng},${destCoords.lat}?annotations=distance`;
        const res = await fetch(osrmUrl);
        if (res.ok) {
          const data: any = await res.json();
          if (data.code === "Ok" && data.distances && data.distances[0] && typeof data.distances[0][1] === "number") {
            const distanceInKm = Math.round((data.distances[0][1] / 1000) * 10) / 10;
            distanceMemoryCache.set(cacheKey, distanceInKm);
            return distanceInKm;
          }
        }
      } catch (osrmErr) {
        console.warn("OSRM table distance check failed, using fallback:", osrmErr);
      }

      // Fallback road estimate: Haversine distance * 1.3 (road network curvature factor).
      // Not cached, so the real road distance is retried once OSRM is reachable again.
      const straightLineKm = calculateHaversineDistance(origCoords, destCoords);
      return Math.round(straightLineKm * 1.3 * 10) / 10;
    }

    return null;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return null;
  }
};

export type GeocodeStatus = "found" | "not_found" | "error";
export type GeocodeSource = "cartociudad" | "photon" | "nominatim" | "manual";
// How exactly the provider matched the address
export type GeocodePrecision = "building" | "street" | "town" | "unknown";

export interface GeocodeHit {
  lat: number;
  lng: number;
  source: GeocodeSource;
  precision: GeocodePrecision;
  // Postcode of the matched place according to the provider (for sanity checks)
  postcode: string | null;
}

export interface GeocodeResult {
  location: { lat: number; lng: number } | null;
  // Present when found: where it came from, precision and provider postcode
  hit: GeocodeHit | null;
  // not_found: every provider answered and none knew the address
  // error: a provider timed out / failed / rate-limited, so it may work on retry
  status: GeocodeStatus;
}

// Same address text => same key. Only whitespace, Unicode form (accents) and
// letter case are normalised, which can never make two different addresses equal.
export const normalizeAddressKey = (address: string) =>
  address.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();

// A stalled provider must not block the lookup (fetch has no timeout of its own)
const GEOCODE_TIMEOUT_MS = 6000;

const fetchJsonWithTimeout = async (
  url: string,
  headers: Record<string, string>
): Promise<{ ok: boolean; data: any }> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) return { ok: false, data: null };
    return { ok: true, data: await res.json() };
  } finally {
    clearTimeout(timeout);
  }
};

// Nominatim's usage policy allows 1 request/second per connection. Calls are
// queued within this POS, and — when a reserver is registered — each call also
// reserves a slot in the shared database so all POS together stay within it.
const NOMINATIM_INTERVAL_MS = 1100;
let nominatimQueue: Promise<void> = Promise.resolve();
let nominatimSlotReserver: ((intervalMs: number) => Promise<number>) | null =
  null;
export const setNominatimSlotReserver = (
  reserver: ((intervalMs: number) => Promise<number>) | null
) => {
  nominatimSlotReserver = reserver;
};
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const scheduleNominatim = <T>(task: () => Promise<T>): Promise<T> => {
  const run = nominatimQueue.then(async () => {
    if (nominatimSlotReserver) {
      try {
        const waitMs = await nominatimSlotReserver(NOMINATIM_INTERVAL_MS);
        if (waitMs > 0) await wait(waitMs);
      } catch {
        // Shared slot unavailable: the local queue still spaces requests
      }
    }
    return task();
  });
  nominatimQueue = run.then(
    () => wait(NOMINATIM_INTERVAL_MS),
    () => wait(NOMINATIM_INTERVAL_MS)
  );
  return run;
};

// "building" only when the provider matched an actual house number. Anything
// else that isn't a street — towns, postcodes, named places (a station, a
// shopping centre…) — counts as "town" so it's flagged as approximate.
// e.g. Photon answers "28521 Rivas-Vaciamadrid" with the railway station.
const cartoCiudadPrecision = (type: unknown): GeocodePrecision => {
  const t = String(type || "").toLowerCase();
  if (t === "portal" || t === "refcatastral") return "building";
  if (t === "callejero" || t === "carretera") return "street";
  return t ? "town" : "unknown";
};

const photonPrecision = (props: any): GeocodePrecision => {
  if (props?.housenumber) return "building";
  if (props?.type === "street") return "street";
  return props ? "town" : "unknown";
};

const nominatimPrecision = (item: any): GeocodePrecision => {
  if (item?.address?.house_number) return "building";
  if (item?.class === "highway" || item?.addresstype === "road") return "street";
  return item ? "town" : "unknown";
};

const cleanPostcode = (value: unknown): string | null => {
  const match = String(value ?? "").match(/\d{5}/);
  return match ? match[0] : null;
};

// Concurrent lookups of the same address share one request
const geocodeInFlight = new Map<string, Promise<GeocodeResult>>();

// Drops an address from this session's cache (used by "look up again")
export const forgetGeocodedAddress = (address: string) => {
  if (address) geocodeMemoryCache.delete(normalizeAddressKey(address));
};

export const geocodeAddressDetailed = async (
  address: string
): Promise<GeocodeResult> => {
  if (!address || !address.trim()) {
    return { location: null, hit: null, status: "not_found" };
  }

  const cleanAddr = address.trim();
  const cacheKey = normalizeAddressKey(cleanAddr);

  // Return from cache (including cached null to prevent infinite retry loops on invalid addresses)
  if (geocodeMemoryCache.has(cacheKey)) {
    const cached = geocodeMemoryCache.get(cacheKey) ?? null;
    return cached
      ? { location: { lat: cached.lat, lng: cached.lng }, hit: cached, status: "found" }
      : { location: null, hit: null, status: "not_found" };
  }
  const inFlight = geocodeInFlight.get(cacheKey);
  if (inFlight) return inFlight;

  const lookup = (async (): Promise<GeocodeResult> => {
    // Generate normalized query variations to handle duplicate prefixes (e.g. CALLE CALLE)
    // or parenthetical administrative text (e.g. "Vaciamadrid (Rivas-Vaciamadrid)")
    const queryCandidates: string[] = [cleanAddr];

    const deduped = cleanAddr
      .replace(
        /\b(calle|avenida|paseo|plaza|ronda|carretera|camino|travesia)\s+\1\b/gi,
        (match, p1) => p1
      )
      .trim();
    if (deduped !== cleanAddr && !queryCandidates.includes(deduped)) {
      queryCandidates.push(deduped);
    }

    const cleanedAdmin = deduped
      .replace(/,\s*[^,()]*\(([^)]+)\)/g, (match, p1) => `, ${p1}`)
      .trim();
    if (!queryCandidates.includes(cleanedAdmin)) {
      queryCandidates.push(cleanedAdmin);
    }

    // CartoCiudad often returns nothing when the postcode is in the text
    // ("Calle Mayor 5, 28013 Madrid" fails, "Calle Mayor 5, Madrid" finds the
    // building), so also try without it. The postcode check on the result still
    // catches a match in the wrong town.
    const withoutPostcode = cleanedAdmin
      .replace(/\b\d{5}\b/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*(,\s*)*/g, ", ")
      .replace(/^[,\s]+|[,\s]+$/g, "")
      .trim();
    if (withoutPostcode && !queryCandidates.includes(withoutPostcode)) {
      queryCandidates.push(withoutPostcode);
    }

    // Set when any provider is unreachable or errors, so a transient outage
    // isn't cached as "address not found" for the rest of the session
    let hadFailure = false;
    const found = (hit: GeocodeHit): GeocodeResult => {
      geocodeMemoryCache.set(cacheKey, hit);
      return { location: { lat: hit.lat, lng: hit.lng }, hit, status: "found" };
    };

    // 1. Try CartoCiudad (Official Spain National Geographic Institute - 100% Free)
    for (const q of queryCandidates) {
      try {
        const { ok, data } = await fetchJsonWithTimeout(
          `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=${encodeURIComponent(q)}&limit=1`,
          { Accept: "application/json" }
        );
        if (!ok) {
          hadFailure = true;
        } else if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lng) {
          return found({
            lat: Number(data[0].lat),
            lng: Number(data[0].lng),
            source: "cartociudad",
            precision: cartoCiudadPrecision(data[0].type),
            postcode: cleanPostcode(data[0].postalCode),
          });
        }
      } catch {
        hadFailure = true;
      }
    }

    // 2. Try Photon (OpenStreetMap geocoder - 100% Free)
    for (const q of queryCandidates) {
      try {
        const { ok, data } = await fetchJsonWithTimeout(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`,
          { Accept: "application/json" }
        );
        const feat = data?.features?.[0];
        if (!ok) {
          hadFailure = true;
        } else if (feat?.geometry?.coordinates) {
          return found({
            lat: Number(feat.geometry.coordinates[1]),
            lng: Number(feat.geometry.coordinates[0]),
            source: "photon",
            precision: photonPrecision(feat.properties),
            postcode: cleanPostcode(feat.properties?.postcode),
          });
        }
      } catch {
        hadFailure = true;
      }
    }

    // 3. Try Nominatim (OpenStreetMap standard geocoder - 100% Free fallback)
    for (const q of queryCandidates) {
      try {
        const { ok, data } = await scheduleNominatim(() =>
          fetchJsonWithTimeout(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1`,
            { "User-Agent": "ThunderJawPOS/1.0" }
          )
        );
        if (!ok) {
          hadFailure = true;
        } else if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          return found({
            lat: Number(data[0].lat),
            lng: Number(data[0].lon),
            source: "nominatim",
            precision: nominatimPrecision(data[0]),
            postcode: cleanPostcode(data[0].address?.postcode),
          });
        }
      } catch {
        hadFailure = true;
      }
    }

    // Cache negative lookup so invalid addresses aren't queried repeatedly,
    // but only when every provider actually answered
    if (!hadFailure) geocodeMemoryCache.set(cacheKey, null);
    return { location: null, hit: null, status: hadFailure ? "error" : "not_found" };
  })();

  geocodeInFlight.set(cacheKey, lookup);
  try {
    return await lookup;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return { location: null, hit: null, status: "error" };
  } finally {
    geocodeInFlight.delete(cacheKey);
  }
};

export const geocodeAddress = async (
  address: string,
  _apiKey?: string
): Promise<{ lat: number; lng: number } | null> =>
  (await geocodeAddressDetailed(address)).location;

export const isPointInPolygon = (
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
): boolean => {
  const x = point.lat, y = point.lng;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const calculateHaversineDistance = (
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

export const calculateBearing = (
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): number => {
  const lat1 = (origin.lat * Math.PI) / 180;
  const lat2 = (dest.lat * Math.PI) / 180;
  const dLng = ((dest.lng - origin.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
};

export const getAngularDifference = (angle1: number, angle2: number): number => {
  const diff = Math.abs(angle1 - angle2) % 360;
  return diff > 180 ? 360 - diff : diff;
};

export const getCompassCode = (bearing: number): string => {
  const directions = [
    { code: "N", min: 337.5, max: 360 },
    { code: "N", min: 0, max: 22.5 },
    { code: "NE", min: 22.5, max: 67.5 },
    { code: "E", min: 67.5, max: 112.5 },
    { code: "SE", min: 112.5, max: 157.5 },
    { code: "S", min: 157.5, max: 202.5 },
    { code: "SW", min: 202.5, max: 247.5 },
    { code: "W", min: 247.5, max: 292.5 },
    { code: "NW", min: 292.5, max: 337.5 },
  ];

  for (const d of directions) {
    if (bearing >= d.min && bearing < d.max) {
      return d.code;
    }
  }
  return "N";
};

export const getCompassDirection = (bearing: number): string => {
  const directions = [
    { label: "Norte", min: 337.5, max: 360 },
    { label: "Norte", min: 0, max: 22.5 },
    { label: "Noreste", min: 22.5, max: 67.5 },
    { label: "Este", min: 67.5, max: 112.5 },
    { label: "Sureste", min: 112.5, max: 157.5 },
    { label: "Sur", min: 157.5, max: 202.5 },
    { label: "Suroeste", min: 202.5, max: 247.5 },
    { label: "Oeste", min: 247.5, max: 292.5 },
    { label: "Noroeste", min: 292.5, max: 337.5 },
  ];

  for (const d of directions) {
    if (bearing >= d.min && bearing < d.max) {
      return d.label;
    }
  }
  return "Norte";
};

// Why a found location may be wrong (shown as a warning on the pin)
export type LocationWarning = "postcode_mismatch" | "outside_zones" | "approximate";

export interface GeocodedDeliveryOrder {
  order: any;
  location: { lat: number; lng: number };
  distanceFromRestaurantKm: number;
  bearing: number;
  compassDir: string;
  compassCode: string;
  // Shared geocode cache key of the address (used to fix / re-look-up the location)
  addressKey?: string;
  locationSource?: GeocodeSource;
  locationWarnings?: LocationWarning[];
}

export interface DeliveryCluster {
  id: string;
  name: string;
  compassDir: string;
  compassCode: string;
  averageBearing: number;
  orders: GeocodedDeliveryOrder[];
  readyCount: number;
  kitchenCount: number;
  maxDistanceBetweenKm: number;
}

export const calculateCircularMean = (angles: number[]): number => {
  if (angles.length === 0) return 0;
  let sinSum = 0;
  let cosSum = 0;
  for (const a of angles) {
    const rad = (a * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  const meanRad = Math.atan2(sinSum, cosSum);
  const deg = (meanRad * 180) / Math.PI;
  return Math.round((deg + 360) % 360);
};

export const findDeliveryClusters = (
  geocodedOrders: GeocodedDeliveryOrder[],
  maxAngleDiff: number = 55,
  maxInterDistanceKm: number = 1.8,
  maxCorridorOffsetKm: number = 0.85
): DeliveryCluster[] => {
  if (geocodedOrders.length === 0) return [];

  // Maximum allowed angular difference between ANY two orders in the same cluster (quadrant cone)
  const maxClusterSpan = 80;

  const assigned = new Set<string>();
  const clusters: DeliveryCluster[] = [];

  // Sort orders by distance from restaurant descending to seed corridors from outward bounds
  const sortedOrders = [...geocodedOrders].sort(
    (a, b) => b.distanceFromRestaurantKm - a.distanceFromRestaurantKm
  );

  for (const seed of sortedOrders) {
    if (assigned.has(seed.order.id)) continue;

    const clusterOrders: GeocodedDeliveryOrder[] = [seed];
    assigned.add(seed.order.id);

    // Iteratively consider all other unassigned orders
    let addedAny = true;
    while (addedAny) {
      addedAny = false;

      for (const candidate of sortedOrders) {
        if (assigned.has(candidate.order.id)) continue;

        // Current cluster mean bearing
        const clusterMean = calculateCircularMean(
          clusterOrders.map((o) => o.bearing)
        );
        const angleFromMean = getAngularDifference(
          clusterMean,
          candidate.bearing
        );

        // Orders close to restaurant (<= 600m) have higher angular sensitivity; allow up to 70° from mean
        const isNearRestaurant = candidate.distanceFromRestaurantKm <= 0.6;
        const allowedAngleFromMean = isNearRestaurant ? 70 : maxAngleDiff;

        if (angleFromMean > allowedAngleFromMean) continue;

        // Ensure adding candidate doesn't cause overall cluster span to exceed maxClusterSpan
        const fitsAngleSpan = clusterOrders.every(
          (existing) =>
            getAngularDifference(existing.bearing, candidate.bearing) <=
            maxClusterSpan
        );
        if (!fitsAngleSpan) continue;

        // 1. Proximity: Candidate is within delivery hop distance to at least one order in the cluster
        const minDistanceToCluster = Math.min(
          ...clusterOrders.map((existing) =>
            calculateHaversineDistance(existing.location, candidate.location)
          )
        );
        const isCloseProximity = minDistanceToCluster <= maxInterDistanceKm;

        // 2. Corridor / En-Route match: candidate is directly on the way to/from this cluster along the arterial route
        const isAlongCorridor = clusterOrders.some((existing) => {
          const angleDiff = getAngularDifference(
            existing.bearing,
            candidate.bearing
          );

          // Must align within a focused corridor cone (<= 25 degrees)
          if (angleDiff > 25) return false;

          // Candidate must be en-route (closer to restaurant than the outer order, with slight margin)
          const isEnRoute =
            candidate.distanceFromRestaurantKm <=
            existing.distanceFromRestaurantKm + 0.5;
          if (!isEnRoute) return false;

          // Cross-track distance (perpendicular detour offset from the corridor line)
          const lateralOffsetKm =
            candidate.distanceFromRestaurantKm *
            Math.sin((angleDiff * Math.PI) / 180);

          return lateralOffsetKm <= maxCorridorOffsetKm;
        });

        if (isCloseProximity || isAlongCorridor) {
          clusterOrders.push(candidate);
          assigned.add(candidate.order.id);
          addedAny = true;
        }
      }
    }

    const bearings = clusterOrders.map((o) => o.bearing);
    const avgBearing = calculateCircularMean(bearings);
    const compass = getCompassDirection(avgBearing);
    const compassCode = getCompassCode(avgBearing);

    let maxDist = 0;
    for (let a = 0; a < clusterOrders.length; a++) {
      for (let b = a + 1; b < clusterOrders.length; b++) {
        const d = calculateHaversineDistance(
          clusterOrders[a].location,
          clusterOrders[b].location
        );
        if (d > maxDist) maxDist = d;
      }
    }

    const readyCount = clusterOrders.filter(
      (o) => o.order.status?.toLowerCase() === "ready for delivery"
    ).length;
    const kitchenCount = clusterOrders.filter(
      (o) => o.order.status?.toLowerCase() === "sent to kitchen"
    ).length;

    clusters.push({
      id: `cluster-${seed.order.id}-${avgBearing}`,
      name: `Rumbo ${compass} (${avgBearing}°)`,
      compassDir: compass,
      compassCode,
      averageBearing: avgBearing,
      orders: clusterOrders,
      readyCount,
      kitchenCount,
      maxDistanceBetweenKm: Math.round(maxDist * 10) / 10,
    });
  }

  // Sort clusters: multi-order corridors first, then by number of ready orders
  return clusters.sort((a, b) => {
    if (a.orders.length !== b.orders.length) {
      return b.orders.length - a.orders.length;
    }
    return b.readyCount - a.readyCount;
  });
};

