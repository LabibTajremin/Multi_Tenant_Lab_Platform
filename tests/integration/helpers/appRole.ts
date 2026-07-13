import { Pool } from 'pg';
import { getPool } from '@/infrastructure/db/client';

// A non-superuser, non-BYPASSRLS Postgres role, created once per test database, so
// the RLS isolation tests (Section 15.3) actually exercise Row-Level Security.
// Connecting as the default `postgres` superuser (used everywhere else in this
// test suite) silently bypasses RLS regardless of policy — that's why these tests
// need a second, deliberately unprivileged connection.
export const APP_ROLE_NAME = 'app_role_test';
const APP_ROLE_PASSWORD = 'app_role_test_password';

let appRolePool: Pool | undefined;

export async function ensureAppRole(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_ROLE_NAME}') THEN
        CREATE ROLE ${APP_ROLE_NAME} LOGIN PASSWORD '${APP_ROLE_PASSWORD}' NOSUPERUSER NOBYPASSRLS;
      END IF;
    END
    $$;
  `);
  await pool.query(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE_NAME}`);
  await pool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_ROLE_NAME}`);
}

export function getAppRolePool(): Pool {
  if (!appRolePool) {
    const url = new URL(process.env.DATABASE_URL as string);
    url.username = APP_ROLE_NAME;
    url.password = APP_ROLE_PASSWORD;
    appRolePool = new Pool({ connectionString: url.toString() });
  }
  return appRolePool;
}

export async function closeAppRolePool(): Promise<void> {
  if (appRolePool) {
    await appRolePool.end();
    appRolePool = undefined;
  }
}
