/* eslint-disable */
// Core tenant-scoped tables (Section 4.2). Every tenant-scoped table carries a
// required tenant_id FK to tenants(id) ON DELETE CASCADE, so a tenant offboarding
// deletion (Section 14 export/backup story) cleanly removes everything in one statement.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE tenants (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug            TEXT UNIQUE NOT NULL,
      lab_name        TEXT NOT NULL,
      university      TEXT,
      logo_url        TEXT,
      theme           TEXT NOT NULL DEFAULT 'default',
      primary_color   TEXT,
      custom_domain   TEXT,
      review_enabled  BOOLEAN NOT NULL DEFAULT false,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`
    CREATE TABLE users (
      id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      email                TEXT NOT NULL,
      password_hash        TEXT NOT NULL,
      role_id              SMALLINT NOT NULL REFERENCES roles(id),
      display_name         TEXT NOT NULL,
      must_reset_password  BOOLEAN NOT NULL DEFAULT true,
      is_active            BOOLEAN NOT NULL DEFAULT true,
      created_by           UUID REFERENCES users(id),
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (tenant_id, email)
    );
  `);

  pgm.sql(`
    CREATE TABLE members (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      user_id         UUID REFERENCES users(id),
      full_name       TEXT NOT NULL,
      photo_url       TEXT,
      photo_alt       TEXT,
      position_id     SMALLINT NOT NULL REFERENCES member_positions(id),
      bio             TEXT,
      contact_email   TEXT,
      join_date       DATE,
      leave_date      DATE,
      sort_order      INT NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`
    CREATE TABLE member_links (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id    UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      platform_id  SMALLINT NOT NULL REFERENCES link_platforms(id),
      url          TEXT NOT NULL,
      UNIQUE (member_id, platform_id)
    );
  `);

  pgm.sql(`
    CREATE TABLE publications (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      authors         TEXT NOT NULL,
      venue           TEXT,
      year            SMALLINT NOT NULL,
      doi_or_link     TEXT,
      pdf_url         TEXT,
      status_id       SMALLINT NOT NULL REFERENCES content_statuses(id) DEFAULT 3,
      review_note     TEXT,
      created_by      UUID NOT NULL REFERENCES users(id),
      reviewed_by     UUID REFERENCES users(id),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`
    CREATE TABLE news_items (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      body            TEXT NOT NULL,
      image_url       TEXT,
      image_alt       TEXT,
      link_url        TEXT,
      status_id       SMALLINT NOT NULL REFERENCES content_statuses(id) DEFAULT 3,
      review_note     TEXT,
      created_by      UUID NOT NULL REFERENCES users(id),
      reviewed_by     UUID REFERENCES users(id),
      published_date  DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`
    CREATE TABLE posts (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      post_type_id    SMALLINT NOT NULL REFERENCES post_types(id),
      title           TEXT NOT NULL,
      body            TEXT,
      image_url       TEXT,
      image_alt       TEXT,
      status_id       SMALLINT NOT NULL REFERENCES content_statuses(id) DEFAULT 3,
      review_note     TEXT,
      created_by      UUID NOT NULL REFERENCES users(id),
      reviewed_by     UUID REFERENCES users(id),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`
    CREATE TABLE site_settings (
      tenant_id       UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      banner_url      TEXT,
      tagline         TEXT,
      contact_email   TEXT,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  pgm.sql(`
    CREATE TABLE site_social_links (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      platform_id  SMALLINT NOT NULL REFERENCES link_platforms(id),
      url          TEXT NOT NULL,
      UNIQUE (tenant_id, platform_id)
    );
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('site_social_links');
  pgm.dropTable('site_settings');
  pgm.dropTable('posts');
  pgm.dropTable('news_items');
  pgm.dropTable('publications');
  pgm.dropTable('member_links');
  pgm.dropTable('members');
  pgm.dropTable('users');
  pgm.dropTable('tenants');
};
