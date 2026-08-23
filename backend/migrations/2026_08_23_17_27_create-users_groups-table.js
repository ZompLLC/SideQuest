/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable("users_groups", {
    user_id: { type: "uuid", notNull: true },
    group_id: { type: "uuid", notNull: true },
  });

  pgm.addConstraint("users_groups", "users_groups_pkey", {
    primaryKey: ["user_id", "group_id"],
  });

  pgm.addConstraint("users_groups", "users_groups_fkey_user_id", {
    foreignKeys: {
      columns: "user_id",
      references: "users(id)",
      onDelete: "CASCADE",
    },
  });

  pgm.addConstraint("users_groups", "users_groups_fkey_group_id", {
    foreignKeys: {
      columns: "group_id",
      references: "groups(id)",
      onDelete: "CASCADE",
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable("users_groups");
};
