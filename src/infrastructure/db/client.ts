import { Pool, type PoolClient } from 'pg';

let pool: Pool | undefined;

/** Singleton connection pool for this process, built from DATABASE_URL. */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set.');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

/**
 * Runs `fn` inside a transaction with `app.tenant_id` set for the duration of that
 * transaction (Section 4.4 defense-in-depth: Row-Level Security policies compare
 * against this setting). Every repository method must go through this — never
 * acquire a raw client and skip tenant scoping, even for a "trusted" query.
 *
 * Uses `set_config` (not a literal `SET LOCAL` string) so the tenant id is bound
 * as a query parameter rather than interpolated into SQL.
 */
export async function withTenantScope<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>,
  poolOverride?: Pool,
): Promise<T> {
  const client = await (poolOverride ?? getPool()).connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, true)', ['app.tenant_id', tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/** This deployment's own tenant, from the required TENANT_ID env var (Section 2). */
export function getCurrentTenantId(): string {
  const tenantId = process.env.TENANT_ID;
  if (!tenantId) {
    throw new Error('TENANT_ID is not set.');
  }
  return tenantId;
}
