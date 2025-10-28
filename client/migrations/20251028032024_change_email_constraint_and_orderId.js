/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return Promise.all([
    knex.schema.alterTable('orders', function(table) {
      table.integer('orderId').alter();
    }),
    knex.schema.alterTable('delivery_persons', function(table) {
      table.dropUnique(['email'], 'delivery_persons_email_unique');
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return Promise.all([
    knex.schema.alterTable('orders', function(table) {
      table.increments('orderId').alter();
    }),
    knex.schema.alterTable('delivery_persons', function(table) {
      table.unique(['email'], 'delivery_persons_email_unique');
    })
  ]);
};