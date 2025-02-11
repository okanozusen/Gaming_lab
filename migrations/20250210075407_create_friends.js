/**
 * @param {import('knex')} knex
 */
exports.up = function(knex) {
    return knex.schema.createTable("friends", (table) => {
      table.increments("id").primary();
      table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      table.integer("friend_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
      table.unique(["user_id", "friend_id"]); // Prevent duplicate friendships
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTableIfExists("friends");
  };
  