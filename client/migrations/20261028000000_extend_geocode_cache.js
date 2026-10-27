/**
 * - geocode_cache: where each location came from, how precise it is and the
 *   postcode the provider returned, so suspicious results can be flagged and
 *   manual corrections are never overwritten by automatic lookups.
 * - geocode_rate_limits: shared request slots so all POS together respect a
 *   provider's rate limit (e.g. Nominatim's 1 request/second).
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasCache = await knex.schema.hasTable("geocode_cache");
  if (hasCache) {
    const columns = ["source", "precision", "resultPostcode", "updatedAt"];
    const existing = {};
    for (const c of columns) {
      existing[c] = await knex.schema.hasColumn("geocode_cache", c);
    }
    if (columns.some((c) => !existing[c])) {
      await knex.schema.table("geocode_cache", function (table) {
        // cartociudad | photon | nominatim | manual
        if (!existing.source) table.string("source").nullable();
        // building | street | town | unknown
        if (!existing.precision) table.string("precision").nullable();
        if (!existing.resultPostcode) table.string("resultPostcode").nullable();
        if (!existing.updatedAt) table.timestamp("updatedAt").defaultTo(knex.fn.now());
      });
    }
  }

  const hasLimits = await knex.schema.hasTable("geocode_rate_limits");
  if (!hasLimits) {
    await knex.schema.createTable("geocode_rate_limits", function (table) {
      table.string("provider").primary();
      table.timestamp("nextAllowedAt", { useTz: true }).notNullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("geocode_rate_limits");
  const hasCache = await knex.schema.hasTable("geocode_cache");
  if (hasCache) {
    for (const c of ["source", "precision", "resultPostcode", "updatedAt"]) {
      if (await knex.schema.hasColumn("geocode_cache", c)) {
        await knex.schema.table("geocode_cache", (table) => table.dropColumn(c));
      }
    }
  }
}
