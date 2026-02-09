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
