/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("groups", {
    id: { type: "uuid", primaryKey: true },
    name: { type: "text", notNull: true },
    owner_id: { type: "text", notNull: true },
    invite_code: { type: "text", notNull: true},
    member_count: { type: "integer", notNull: true, default: 1},
    season_length: { type: "integer", notNull: true, deafult: 30},
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("groups");
};
