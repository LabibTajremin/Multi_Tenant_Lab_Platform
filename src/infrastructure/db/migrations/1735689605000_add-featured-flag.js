/* eslint-disable */
// Lets an Admin curate which publications/news items are pulled out onto the
// home page (rather than always showing just "most recent N"), per the
// homepage-redesign request. A partial index backs the home page's "featured
// first" query the same way the existing pending-review partial indexes do.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE publications ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;`);
  pgm.sql(`ALTER TABLE news_items ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;`);

  pgm.sql(`
    CREATE INDEX idx_publications_featured ON publications(tenant_id, year DESC)
      WHERE is_featured = true AND status_id = 3;
  `);
  pgm.sql(`
    CREATE INDEX idx_news_featured ON news_items(tenant_id, published_date DESC)
      WHERE is_featured = true AND status_id = 3;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP INDEX IF EXISTS idx_news_featured;`);
  pgm.sql(`DROP INDEX IF EXISTS idx_publications_featured;`);
  pgm.sql(`ALTER TABLE news_items DROP COLUMN IF EXISTS is_featured;`);
  pgm.sql(`ALTER TABLE publications DROP COLUMN IF EXISTS is_featured;`);
};
