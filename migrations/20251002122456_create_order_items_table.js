/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('order_items', function(table) {
    table.string('id').primary();
    table.string('orderId');
    table.string('productId').notNullable();
    table.string('productName').notNullable();
    table.string('productDescription').notNullable();
    table.float('productPrice').notNullable().defaultTo(0.00);
    table.float('productDiscount').notNullable().defaultTo(0.00);
    table.integer('productPriority').notNullable();
    table.float('productTax').notNullable();
    table.integer('quantity').defaultTo(1);
    table.float('totalPrice').defaultTo(0.00);
    table.string('variantId');
    table.string('variantName');
    table.float('variantPrice');
    table.text('printers');
    table.text('complements');
    table.text('menuDescription');
    table.float('menuDiscount');
    table.float('menuTax');
    table.float('menuPrice');
    table.string('menuId');
    table.integer('menuSecondaryId');
    table.string('menuName');
    table.string('menuPageId');
    table.string('menuPageName');
    table.float('supplement');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.foreign('orderId').references('id').inTable('orders').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  return knex.schema.dropTable('order_items');
};
