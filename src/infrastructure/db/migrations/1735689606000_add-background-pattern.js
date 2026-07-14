/* eslint-disable */
// Lets an Admin pick a subtle background texture (Section 9-style curated
// palette, same reasoning as primary_color) applied consistently across the
// admin and public site canvases.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE tenants ADD COLUMN background_pattern TEXT NOT NULL DEFAULT 'dots';`);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE tenants DROP COLUMN IF EXISTS background_pattern;`);
};
