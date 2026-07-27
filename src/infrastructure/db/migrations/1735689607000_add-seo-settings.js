/* eslint-disable */
// SEO-oriented, Admin-controlled site settings:
//   - meta_description: the <meta name="description"> / Open Graph description
//     used across the public site, so a tenant controls how their site is
//     summarized in search results and social cards without touching code.
//   - footer_nav_enabled: whether the primary navigation menu is mirrored in
//     the site footer. Footer navigation is a well-established SEO/crawlability
//     aid (every page links to every section), but some tenants prefer a
//     minimal footer — so it's a toggle, defaulting to on.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE site_settings
      ADD COLUMN meta_description   TEXT,
      ADD COLUMN footer_nav_enabled BOOLEAN NOT NULL DEFAULT true;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE site_settings
      DROP COLUMN IF EXISTS meta_description,
      DROP COLUMN IF EXISTS footer_nav_enabled;
  `);
};
