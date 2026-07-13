import { config } from 'dotenv';
import { ensureAppRole } from './helpers/appRole';

// Integration tests run against a real, disposable Postgres instance (Docker service
// container in CI, docker-compose locally) — never a shared dev/prod database.
config({ path: '.env.test' });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.test.example to .env.test (or export DATABASE_URL) ' +
      'and point it at a disposable test Postgres instance before running integration tests.',
  );
}

await ensureAppRole();
