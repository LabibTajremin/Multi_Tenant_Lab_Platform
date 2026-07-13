/* eslint-disable */
// Static, platform-wide lookup tables (Section 4.1). Not tenant-scoped — shared
// across every tenant deployment. New values can be added with a plain INSERT,
// no migration required, for link_platforms / post_types in particular.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('roles', {
    id: { type: 'smallint', primaryKey: true },
    name: { type: 'text', notNull: true, unique: true },
  });
  pgm.sql(`INSERT INTO roles (id, name) VALUES (1,'admin'), (2,'editor')`);

  pgm.createTable('content_statuses', {
    id: { type: 'smallint', primaryKey: true },
    name: { type: 'text', notNull: true, unique: true },
  });
  pgm.sql(
    `INSERT INTO content_statuses (id, name) VALUES
      (1,'draft'), (2,'pending_review'), (3,'published'), (4,'rejected')`,
  );

  pgm.createTable('member_positions', {
    id: { type: 'smallint', primaryKey: true },
    name: { type: 'text', notNull: true, unique: true },
    sort_rank: { type: 'smallint', notNull: true },
  });
  pgm.sql(
    `INSERT INTO member_positions (id, name, sort_rank) VALUES
      (1,'PI',1), (2,'Postdoc',2), (3,'PhD',3), (4,'MS',4), (5,'Undergrad',5), (6,'Alumnus',6)`,
  );

  pgm.createTable('post_types', {
    id: { type: 'smallint', primaryKey: true },
    name: { type: 'text', notNull: true, unique: true },
  });
  pgm.sql(`INSERT INTO post_types (id, name) VALUES (1,'funding'), (2,'gallery')`);

  pgm.createTable('link_platforms', {
    id: { type: 'smallint', primaryKey: true },
    name: { type: 'text', notNull: true, unique: true },
  });
  pgm.sql(
    `INSERT INTO link_platforms (id, name) VALUES
      (1,'website'), (2,'linkedin'), (3,'google_scholar'), (4,'twitter'), (5,'github')`,
  );
};

exports.down = (pgm) => {
  pgm.dropTable('link_platforms');
  pgm.dropTable('post_types');
  pgm.dropTable('member_positions');
  pgm.dropTable('content_statuses');
  pgm.dropTable('roles');
};
