/**
 * Records whether the new-order sound was played and the receipt auto-printed
 * for web/app orders on the master POS, so a missed alert (POS starting up,
 * logged out, printer briefly unreachable) is retried instead of silently lost.
 *
 * - alertNotifiedAt:    when the notification sound was played
 * - autoPrintedAt:      when the receipt was printed successfully
 * - autoPrintAttempts:  failed print attempts so far (retries stop at a limit)
 * - autoPrintLastError: last print error (for staff / support)
 *
 * Existing web/app orders are marked as already handled so nothing old is
 * printed again after the update.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const COLUMNS = [
  "alertNotifiedAt",
  "autoPrintedAt",
  "autoPrintAttempts",
  "autoPrintLastError",
];

export async function up(knex) {
  const hasTable = await knex.schema.hasTable("orders");
  if (!hasTable) return;

  const existing = {};
  for (const c of COLUMNS) {
    existing[c] = await knex.schema.hasColumn("orders", c);
  }
  if (COLUMNS.some((c) => !existing[c])) {
    await knex.schema.table("orders", function (table) {
      if (!existing.alertNotifiedAt) table.timestamp("alertNotifiedAt").nullable();
      if (!existing.autoPrintedAt) table.timestamp("autoPrintedAt").nullable();
      if (!existing.autoPrintAttempts) table.integer("autoPrintAttempts").notNullable().defaultTo(0);
      if (!existing.autoPrintLastError) table.text("autoPrintLastError").nullable();
    });
  }

  // Everything that already exists counts as handled
  await knex("orders")
    .where(function () {
      this.where("orderType", "like", "web:%").orWhere("orderType", "like", "app:%");
    })
    .whereNull("autoPrintedAt")
    .update({
      alertNotifiedAt: knex.raw('COALESCE("createdAt", now())'),
      autoPrintedAt: knex.raw('COALESCE("createdAt", now())'),
    });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasTable = await knex.schema.hasTable("orders");
  if (!hasTable) return;
  for (const c of COLUMNS) {
    if (await knex.schema.hasColumn("orders", c)) {
      await knex.schema.table("orders", (table) => table.dropColumn(c));
    }
  }
}
