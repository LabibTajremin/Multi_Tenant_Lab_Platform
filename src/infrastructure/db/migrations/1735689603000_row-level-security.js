/* eslint-disable */
// Row-Level Security (Section 4.4) — defense in depth on top of repository-layer
// tenant_id filtering. Even a bug that skips the repository WHERE clause cannot
// leak another tenant's rows, as long as the connecting DB role is NOT a
// superuser/BYPASSRLS role (see README: production DATABASE_URL must use a
// dedicated, non-superuser application role).
//
// Each request sets `SET LOCAL app.tenant_id = '<uuid>'` inside its transaction
// (see infrastructure/db/client.ts); policies compare against that setting.

const TENANT_SCOPED_TABLES = ['publications', 'news_items', 'posts', 'members', 'users', 'site_social_links', 'site_settings'];

exports.shorthands = undefined;

exports.up = (pgm) => {
  for (const table of TENANT_SCOPED_TABLES) {
    pgm.sql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    pgm.sql(`
      CREATE POLICY tenant_isolation ON ${table}
        USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
        WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
    `);
  }

  // member_links has no tenant_id column of its own (Section 4.2) — scope it via
  // its parent member row instead of denormalizing tenant_id onto the join table.
  pgm.sql(`ALTER TABLE member_links ENABLE ROW LEVEL SECURITY;`);
  pgm.sql(`
    CREATE POLICY tenant_isolation ON member_links
      USING (EXISTS (
        SELECT 1 FROM members m
        WHERE m.id = member_links.member_id
          AND m.tenant_id = current_setting('app.tenant_id', true)::uuid
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM members m
        WHERE m.id = member_links.member_id
          AND m.tenant_id = current_setting('app.tenant_id', true)::uuid
      ));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP POLICY IF EXISTS tenant_isolation ON member_links;`);
  pgm.sql(`ALTER TABLE member_links DISABLE ROW LEVEL SECURITY;`);

  for (const table of [...TENANT_SCOPED_TABLES].reverse()) {
    pgm.sql(`DROP POLICY IF EXISTS tenant_isolation ON ${table};`);
    pgm.sql(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
  }
};
