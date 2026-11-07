/**
 * Shared outbox for web/app order status updates.
 *
 * Every POS (master or client) writes its order status updates into this table
 * in the shared database. Only the master POS sends them to the VPS. Before
 * this, each POS kept its own local queue and only the master's was ever sent,
 * so status changes made on a client POS (e.g. "sent to kitchen") never reached
 * the website.
 *
 * - id:            send order, assigned by the database (no PC clock involved)
 * - orderId:       the web/app order the update belongs to
 * - payload:       JSON body for PUT /api/v1/orders/:id/status
 * - deviceName:    which POS made the change
 * - attempts, lastError, lastAttemptAt: retry bookkeeping
 * - parkedAt:      set when the VPS rejects the update outright; parked rows
 *                  are not retried and do not block the rows behind them
 * - createdAt:     database time when the update was saved
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable("order_sync_queue");
  if (exists) return;

  await knex.schema.createTable("order_sync_queue", function (table) {
    table.increments("id").primary();
    table.string("orderId").notNullable();
    table.text("payload").notNullable();
    table.string("deviceName").nullable();
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("lastError").nullable();
    table.timestamp("lastAttemptAt").nullable();
    table.timestamp("parkedAt").nullable();
    table.timestamp("createdAt").notNullable().defaultTo(knex.fn.now());
    table.index(["parkedAt", "id"], "order_sync_queue_pending_idx");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("order_sync_queue");
}
