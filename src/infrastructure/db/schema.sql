-- Reference snapshot of the schema produced by src/infrastructure/db/migrations/*.
-- This file is documentation only — it is never executed by tooling. The
-- migrations are the source of truth; run `npm run migrate:up` to apply them.
-- Regenerate this file by hand (or via `pg_dump --schema-only`) whenever a
-- migration changes the schema, so it stays a faithful reference.

-- ============================================================
-- Lookup / reference tables (platform-wide, not tenant-scoped)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE roles (
  id    SMALLINT PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL
);
INSERT INTO roles (id, name) VALUES (1,'admin'), (2,'editor');

CREATE TABLE content_statuses (
  id    SMALLINT PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL
);
INSERT INTO content_statuses (id, name) VALUES
  (1,'draft'), (2,'pending_review'), (3,'published'), (4,'rejected');

CREATE TABLE member_positions (
  id         SMALLINT PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  sort_rank  SMALLINT NOT NULL
);
INSERT INTO member_positions (id, name, sort_rank) VALUES
  (1,'PI',1), (2,'Postdoc',2), (3,'PhD',3), (4,'MS',4), (5,'Undergrad',5), (6,'Alumnus',6);

CREATE TABLE post_types (
  id    SMALLINT PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL
);
INSERT INTO post_types (id, name) VALUES (1,'funding'), (2,'gallery');

CREATE TABLE link_platforms (
  id    SMALLINT PRIMARY KEY,
  name  TEXT UNIQUE NOT NULL
);
INSERT INTO link_platforms (id, name) VALUES
  (1,'website'), (2,'linkedin'), (3,'google_scholar'), (4,'twitter'), (5,'github');

-- ============================================================
-- Core tables (tenant-scoped unless noted)
-- ============================================================

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

CREATE TABLE member_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  platform_id  SMALLINT NOT NULL REFERENCES link_platforms(id),
  url          TEXT NOT NULL,
  UNIQUE (member_id, platform_id)
);

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
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(authors,''))
  ) STORED
);

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

CREATE TABLE site_settings (
  tenant_id       UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  banner_url      TEXT,
  tagline         TEXT,
  contact_email   TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE site_social_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform_id  SMALLINT NOT NULL REFERENCES link_platforms(id),
  url          TEXT NOT NULL,
  UNIQUE (tenant_id, platform_id)
);

-- ============================================================
-- Indexes — see Section 4.3 of the implementation instructions for the
-- reasoning behind each one. Full list lives in
-- migrations/1735689602000_indexes.js.
-- ============================================================

-- ============================================================
-- Row-Level Security — see migrations/1735689603000_row-level-security.js.
-- Every tenant-scoped table (publications, news_items, posts, members,
-- member_links, users, site_social_links, site_settings) has RLS enabled with
-- a `tenant_isolation` policy comparing against `current_setting('app.tenant_id')`.
-- The connecting DB role for the app MUST NOT be a superuser/BYPASSRLS role, or
-- this layer is silently skipped.
-- ============================================================
