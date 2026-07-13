/* eslint-disable */
// Adds a third post_types row so the /research public page (Section 12) has a
// dedicated, Admin-editable content type distinct from funding/gallery — a
// lookup-table INSERT, per the Section 4.1 guidance that new post_types don't
// need a schema change, just a migration recording the row.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`INSERT INTO post_types (id, name) VALUES (3, 'research')`);
};

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM post_types WHERE id = 3`);
};
