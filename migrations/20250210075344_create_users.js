/**
 * @param {import('knex')} knex
 */
exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
      table.increments("id").primary();
      table.string("username").notNullable().unique();
      table.string("email").notNullable().unique();
      table.string("password").notNullable();
      table.string("profile_picture").defaultTo("https://picsum.photos/200");
      table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("users");
};
