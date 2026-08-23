/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("groups", {
    id: { type: "uuid", primaryKey: true },
    name: { type: "text", notNull: true, unique: true },
    ownerId: { type: "text", notNull: true, unique: true },
    inviteCode: { type: "text", notNull: true},
    memberCount: { type: "integer", notNull: true, default: 0},
    seasonLength: { type: "integer", notNull: true, deafult: 30},
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
