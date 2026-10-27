import { db } from "./index.js";

export interface GeocodeCacheEntry {
  addressKey: string;
  lat: number;
  lng: number;
  // cartociudad | photon | nominatim | manual
  source?: string | null;
  // building | street | town | unknown
  precision?: string | null;
  resultPostcode?: string | null;
}

const isValidEntry = (e: GeocodeCacheEntry) =>
  !!e?.addressKey && Number.isFinite(e.lat) && Number.isFinite(e.lng);

export class GeocodeCacheOperations {
  static async getMany(addressKeys: string[]): Promise<GeocodeCacheEntry[]> {
    if (addressKeys.length === 0) return [];
    const rows = await db("geocode_cache")
      .select(
        "addressKey",
        "latitude",
        "longitude",
        "source",
        "precision",
        "resultPostcode"
      )
      .whereIn("addressKey", addressKeys);
    return rows.map((r) => ({
      addressKey: r.addressKey,
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      source: r.source ?? null,
      precision: r.precision ?? null,
      resultPostcode: r.resultPostcode ?? null,
    }));
  }

  // Automatic lookups: never overwrite a location a user placed by hand
  static async saveMany(entries: GeocodeCacheEntry[]): Promise<void> {
    // One row per key: Postgres rejects an upsert that hits the same key twice
    const byKey = new Map<string, GeocodeCacheEntry>();
    for (const e of entries) {
      if (isValidEntry(e) && e.source !== "manual") byKey.set(e.addressKey, e);
    }
    const valid = Array.from(byKey.values());
    if (valid.length === 0) return;
    const now = new Date().toISOString();
    await db("geocode_cache")
      .insert(
        valid.map((e) => ({
          addressKey: e.addressKey,
          latitude: e.lat,
          longitude: e.lng,
          source: e.source ?? null,
          precision: e.precision ?? null,
          resultPostcode: e.resultPostcode ?? null,
          createdAt: now,
          updatedAt: now,
        }))
      )
      .onConflict("addressKey")
      .merge(["latitude", "longitude", "source", "precision", "resultPostcode", "updatedAt"])
      .whereRaw(`"geocode_cache"."source" IS DISTINCT FROM ?`, ["manual"]);
  }

  // A location placed by a user on the map: always wins
  static async setManual(addressKey: string, lat: number, lng: number): Promise<void> {
    if (!isValidEntry({ addressKey, lat, lng })) {
      throw new Error("Invalid manual location");
    }
    const now = new Date().toISOString();
    await db("geocode_cache")
      .insert({
        addressKey,
        latitude: lat,
        longitude: lng,
        source: "manual",
        precision: "building",
        resultPostcode: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflict("addressKey")
      .merge(["latitude", "longitude", "source", "precision", "resultPostcode", "updatedAt"]);
  }

  // "Look up again": forget the stored location (manual ones included)
  static async deleteKey(addressKey: string): Promise<void> {
    await db("geocode_cache").where({ addressKey }).del();
  }

  // Reserves the next request slot for a provider, shared by every POS on this
  // database. Returns how long (ms) the caller must wait before sending.
  // A single UPDATE row-locks, so concurrent POS get consecutive slots.
  static async reserveRateLimitSlot(
    provider: string,
    intervalMs: number
  ): Promise<number> {
    const secs = Math.max(0, intervalMs) / 1000;
    await db.raw(
      `INSERT INTO "geocode_rate_limits" ("provider", "nextAllowedAt")
       VALUES (?, clock_timestamp()) ON CONFLICT ("provider") DO NOTHING`,
      [provider]
    );
    const result = await db.raw(
      `UPDATE "geocode_rate_limits"
       SET "nextAllowedAt" = GREATEST("nextAllowedAt", clock_timestamp()) + make_interval(secs => ?)
       WHERE "provider" = ?
       RETURNING GREATEST(0, EXTRACT(EPOCH FROM ("nextAllowedAt" - make_interval(secs => ?) - clock_timestamp())) * 1000) AS "waitMs"`,
      [secs, provider, secs]
    );
    return Math.ceil(Number(result?.rows?.[0]?.waitMs) || 0);
  }
}
