export interface AddressCandidate {
  id: string;
  displayAddress: string;
  street: string;
  streetNumber?: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  source: "cartociudad" | "photon" | "fallback";
}

// In-memory cache for fast, zero-latency repeated searches
const searchCache = new Map<string, AddressCandidate[]>();

/**
 * Open-source Spanish & Global address search using CartoCiudad (IGN Spain)
 * with Photon (OpenStreetMap) fallback.
 * 100% Free - €0.00 cost, no API keys, no session fees.
 */
export async function searchAddressCandidates(query: string): Promise<AddressCandidate[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 3) return [];

  const cacheKey = cleanQuery.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  const results: AddressCandidate[] = [];
  // Empty results are only cached when both providers answered; a timeout or
  // outage must not stick as "no matches" for the rest of the session
  let hadFailure = false;

  // 1. Try CartoCiudad (Official Spain IGN Geocoder - perfect for Spain addresses)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const ccUrl = `https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=${encodeURIComponent(cleanQuery)}&limit=6`;
    const res = await fetch(ccUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      hadFailure = true;
    } else {
      const data: any = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          let street = (item.address || "").trim();
          const tipVia = (item.tip_via || "").trim();
          if (tipVia && street && !street.toLowerCase().startsWith(tipVia.toLowerCase())) {
            street = `${tipVia} ${street}`;
          }
          if (street.includes(",")) {
            street = street.split(",")[0].trim();
          }
          const city = item.muni || item.poblacion || "";
          const province = item.province || "";
          const postalCode = item.postalCode || "";

          // Build clean display address
          const displayParts = [street, city, province, postalCode].filter(Boolean);
          const displayAddress = displayParts.join(", ");

          results.push({
            id: `cc_${item.id || Math.random().toString(36).substring(2)}`,
            displayAddress: displayAddress || street,
            street: street,
            city: city,
            province: province,
            postalCode: postalCode,
            lat: item.lat ? Number(item.lat) : null,
            lng: item.lng ? Number(item.lng) : null,
            source: "cartociudad",
          });
        }
      }
    }
  } catch (err) {
    // Timeout or network error, fallback to Photon below
    hadFailure = true;
  }

  if (results.length > 0) {
    searchCache.set(cacheKey, results);
    return results;
  }

  // 2. Try Photon (Komoot / OpenStreetMap - global multilingual geocoder)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=6`;
    const res = await fetch(photonUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      hadFailure = true;
    } else {
      const data: any = await res.json();
      const features = data?.features || [];

      for (const feat of features) {
        const props = feat.properties || {};
        const streetName = [props.street || props.name, props.housenumber].filter(Boolean).join(" ");
        const city = props.city || props.district || props.town || props.village || "";
        const province = props.state || props.county || "";
        const postalCode = props.postcode || "";

        const displayParts = [streetName, city, province, postalCode].filter(Boolean);
        const displayAddress = displayParts.join(", ");

        results.push({
          id: `osm_${props.osm_type || "W"}_${props.osm_id || Math.random().toString(36).substring(2)}`,
          displayAddress: displayAddress || streetName,
          street: streetName || props.name || "",
          city: city,
          province: province,
          postalCode: postalCode,
          lat: feat.geometry?.coordinates?.[1] ?? null,
          lng: feat.geometry?.coordinates?.[0] ?? null,
          source: "photon",
        });
      }
    }
  } catch (err) {
    // Fallback if photon is also unavailable
    hadFailure = true;
  }

  if (results.length > 0 || !hadFailure) {
    searchCache.set(cacheKey, results);
  }
  return results;
}
