import { describe, expect, it } from 'vitest';
import { Pool } from 'pg';

describe('test database connectivity', () => {
  it('can reach the disposable Postgres instance configured for integration tests', async () => {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const result = await pool.query('SELECT 1 AS ok');
      expect(result.rows[0]).toEqual({ ok: 1 });
    } finally {
      await pool.end();
    }
  });
});
