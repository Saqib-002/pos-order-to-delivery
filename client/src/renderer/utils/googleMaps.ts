export const calculateDistance = async (
  origin: string,
  destination: string,
  apiKey: string
): Promise<number | null> => {
  if (!origin || !destination || !apiKey) return null;

  try {
    if (window.google && window.google.maps && window.google.maps.importLibrary) {
      const { DistanceMatrixService } = (await window.google.maps.importLibrary(
        "routes"
      )) as any;
      const service = new DistanceMatrixService();

      return new Promise((resolve) => {
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [destination],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
          },
          (response: any, status: string) => {
            if (status === "OK" && response.rows[0].elements[0].status === "OK") {
              const distanceInMeters = response.rows[0].elements[0].distance.value;
              resolve(distanceInMeters / 1000); 
            } else {
              console.error("Distance Matrix failed:", status);
              resolve(null);
            }
          }
        );
      });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.rows[0].elements[0].status === "OK") {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      return distanceInMeters / 1000; 
    }
    return null;
  } catch (error) {
    console.error("Error calculating distance:", error);
    return null;
  }
};
export const geocodeAddress = async (
  address: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> => {
  if (!address || !apiKey) return null;

  try {
    if (window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      return new Promise((resolve) => {
        geocoder.geocode({ address }, (results: any, status: any) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            console.error("Geocoder failed:", status);
            resolve(null);
          }
        });
      });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      return data.results[0].geometry.location;
    }
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
  if (!window.google || !window.google.maps || !window.google.maps.geometry) {
    // Fallback ray casting algorithm if google maps geometry library is not loaded
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
  }

  const googlePolygon = new window.google.maps.Polygon({ paths: polygon });
  const googlePoint = new window.google.maps.LatLng(point.lat, point.lng);
  return window.google.maps.geometry.poly.containsLocation(googlePoint, googlePolygon);
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
  maxInterDistanceKm: number = 1.8
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

        // Proximity: Candidate must be within delivery hop distance to at least one order in the cluster
        const minDistanceToCluster = Math.min(
          ...clusterOrders.map((existing) =>
            calculateHaversineDistance(existing.location, candidate.location)
          )
        );

        if (minDistanceToCluster <= maxInterDistanceKm) {
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

