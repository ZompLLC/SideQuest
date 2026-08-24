/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("quests", {
    id: { type: "uuid", primaryKey: true },
    group_id: { type: "uuid", notNull: true },
    creator_id: { type: "uuid", notNull: true },
    title: { type: "text", notNull: true },
    description: { type: "text", notNull: true },
    point_value: { type: "integer", notNull: true },
    status: { type: "text", notNull: true, default: "pending" },
    due_at: {
      type: "timestamptz",
      notNull: true,
    },
    completed_at: {
      type: "timestamptz",
    },
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
  pgm.dropTable("quests");
};
