// In-memory caches to prevent duplicate network calls
const geocodeMemoryCache = new Map<string, { lat: number; lng: number } | null>();
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

export const geocodeAddress = async (
  address: string,
  apiKey?: string
): Promise<{ lat: number; lng: number } | null> => {
  if (!address || !address.trim()) return null;

  const cleanAddr = address.trim();
  const cacheKey = cleanAddr.toLowerCase();

  // Return from cache (including cached null to prevent infinite retry loops on invalid addresses)
  if (geocodeMemoryCache.has(cacheKey)) {
    return geocodeMemoryCache.get(cacheKey) ?? null;
  }

  try {
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

    // Set when any provider is unreachable or errors, so a transient outage
    // isn't cached as "address not found" for the rest of the session
    let hadFailure = false;

    // 1. Try CartoCiudad (Official Spain National Geographic Institute - 100% Free)
    for (const q of queryCandidates) {
      try {
        const ccUrl = `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=${encodeURIComponent(q)}&limit=1`;
        const ccRes = await fetch(ccUrl, { headers: { Accept: "application/json" } });
        if (!ccRes.ok) {
          hadFailure = true;
        } else {
          const ccData: any = await ccRes.json();
          if (Array.isArray(ccData) && ccData.length > 0 && ccData[0].lat && ccData[0].lng) {
            const loc = { lat: Number(ccData[0].lat), lng: Number(ccData[0].lng) };
            geocodeMemoryCache.set(cacheKey, loc);
            return loc;
          }
        }
      } catch {
        hadFailure = true;
      }
    }

    // 2. Try Photon (OpenStreetMap geocoder - 100% Free)
    for (const q of queryCandidates) {
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=1`;
        const pRes = await fetch(photonUrl, { headers: { Accept: "application/json" } });
        if (!pRes.ok) {
          hadFailure = true;
        } else {
          const pData: any = await pRes.json();
          const feat = pData?.features?.[0];
          if (feat?.geometry?.coordinates) {
            const loc = {
              lat: Number(feat.geometry.coordinates[1]),
              lng: Number(feat.geometry.coordinates[0]),
            };
            geocodeMemoryCache.set(cacheKey, loc);
            return loc;
          }
        }
      } catch {
        hadFailure = true;
      }
    }

    // 3. Try Nominatim (OpenStreetMap standard geocoder - 100% Free fallback)
    for (const q of queryCandidates) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
        const nRes = await fetch(nomUrl, { headers: { "User-Agent": "ThunderJawPOS/1.0" } });
        if (!nRes.ok) {
          hadFailure = true;
        } else {
          const nData: any = await nRes.json();
          if (Array.isArray(nData) && nData.length > 0 && nData[0].lat && nData[0].lon) {
            const loc = { lat: Number(nData[0].lat), lng: Number(nData[0].lon) };
            geocodeMemoryCache.set(cacheKey, loc);
            return loc;
          }
        }
      } catch {
        hadFailure = true;
      }
    }

    // Cache negative lookup so invalid addresses aren't queried repeatedly,
    // but only when every provider actually answered
    if (!hadFailure) geocodeMemoryCache.set(cacheKey, null);
    return null;
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
};

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

export interface GeocodedDeliveryOrder {
  order: any;
  location: { lat: number; lng: number };
  distanceFromRestaurantKm: number;
  bearing: number;
  compassDir: string;
  compassCode: string;
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

