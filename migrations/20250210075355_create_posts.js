/**
 * @param {import('knex')} knex
 */
exports.up = function(knex) {
    return knex.schema.createTable("posts", (table) => {
      table.increments("id").primary();
      table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      table.string("game_name").notNullable();
      table.text("content").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists("posts");
  };
  