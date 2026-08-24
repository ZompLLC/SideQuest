/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("quests_assignments", {
    quest_id: { type: "uuid", notNull: true },
    group_id: { type: "uuid", notNull: true },
    user_id: { type: "uuid", notNull: true },
  });

  pgm.addConstraint("quests_assignments", "quests_assignments_pkey", {
    primaryKey: ["quest_id", "group_id", "user_id"],
  });

  pgm.addConstraint("quests_assignments", "quests_assignments_fkey_quest_id", {
    foreignKeys: {
      columns: "quest_id",
      references: "quests(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("quests_assignments", "quests_assignments_fkey_group_id", {
    foreignKeys: {
      columns: "group_id",
      references: "groups(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("quests_assignments", "quests_assignments_fkey_user_id", {
    foreignKeys: {
      columns: "user_id",
      references: "users(id)",
      onDelete: "CASCADE",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("quests_assignments");
};