/* eslint-disable */
// Indexing strategy (Section 4.3): every FK's referencing side, every composite the
// public listing/review-queue queries actually filter+sort on, uniqueness/lookup
// indexes, and full-text search for the publications list. No speculative indexes.

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Foreign keys (Postgres does not auto-index the referencing side).
  pgm.sql(`CREATE INDEX idx_users_tenant             ON users(tenant_id);`);
  pgm.sql(`CREATE INDEX idx_users_tenant_role        ON users(tenant_id, role_id);`);
  pgm.sql(`CREATE INDEX idx_members_tenant           ON members(tenant_id);`);
  pgm.sql(`CREATE INDEX idx_members_user             ON members(user_id) WHERE user_id IS NOT NULL;`);
  pgm.sql(`CREATE INDEX idx_member_links_member      ON member_links(member_id);`);
  pgm.sql(`CREATE INDEX idx_publications_tenant      ON publications(tenant_id);`);
  pgm.sql(`CREATE INDEX idx_publications_created_by  ON publications(created_by);`);
  pgm.sql(`CREATE INDEX idx_publications_reviewed_by ON publications(reviewed_by);`);
  pgm.sql(`CREATE INDEX idx_news_tenant              ON news_items(tenant_id);`);
  pgm.sql(`CREATE INDEX idx_news_created_by          ON news_items(created_by);`);
  pgm.sql(`CREATE INDEX idx_news_reviewed_by         ON news_items(reviewed_by);`);
  pgm.sql(`CREATE INDEX idx_posts_tenant             ON posts(tenant_id);`);
  pgm.sql(`CREATE INDEX idx_posts_created_by         ON posts(created_by);`);
  pgm.sql(`CREATE INDEX idx_posts_reviewed_by        ON posts(reviewed_by);`);
  pgm.sql(`CREATE INDEX idx_site_social_tenant       ON site_social_links(tenant_id);`);

  // Composite indexes for the actual page queries.
  pgm.sql(`
    CREATE INDEX idx_publications_tenant_status_year
      ON publications(tenant_id, status_id, year DESC);
  `);
  pgm.sql(`
    CREATE INDEX idx_news_tenant_status_date
      ON news_items(tenant_id, status_id, published_date DESC);
  `);
  pgm.sql(`
    CREATE INDEX idx_posts_tenant_type_status
      ON posts(tenant_id, post_type_id, status_id);
  `);
  pgm.sql(`
    CREATE INDEX idx_members_tenant_position_sort
      ON members(tenant_id, position_id, sort_order);
  `);

  // Partial indexes for the admin review queue — pending rows are a small slice.
  pgm.sql(`CREATE INDEX idx_publications_pending ON publications(tenant_id, created_at) WHERE status_id = 2;`);
  pgm.sql(`CREATE INDEX idx_news_pending ON news_items(tenant_id, created_at) WHERE status_id = 2;`);
  pgm.sql(`CREATE INDEX idx_posts_pending ON posts(tenant_id, created_at) WHERE status_id = 2;`);

  // Uniqueness / lookup indexes.
  pgm.sql(`CREATE UNIQUE INDEX idx_tenants_slug          ON tenants(slug);`);
  pgm.sql(`CREATE UNIQUE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;`);

  // Full-text search for the publications list (title + authors).
  pgm.sql(`
    ALTER TABLE publications ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(authors,''))) STORED;
  `);
  pgm.sql(`CREATE INDEX idx_publications_search ON publications USING GIN (search_vector);`);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_publications_search;`);
  pgm.sql(`ALTER TABLE publications DROP COLUMN IF EXISTS search_vector;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_tenants_custom_domain;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_tenants_slug;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_posts_pending;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_news_pending;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_publications_pending;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_members_tenant_position_sort;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_posts_tenant_type_status;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_news_tenant_status_date;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_publications_tenant_status_year;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_site_social_tenant;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_posts_reviewed_by;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_posts_created_by;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_posts_tenant;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_news_reviewed_by;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_news_created_by;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_news_tenant;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_publications_reviewed_by;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_publications_created_by;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_publications_tenant;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_member_links_member;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_members_user;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_members_tenant;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_users_tenant_role;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_users_tenant;`);
};
