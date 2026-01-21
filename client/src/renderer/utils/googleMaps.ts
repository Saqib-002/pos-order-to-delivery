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
