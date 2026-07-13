import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const validEnv = {
  TENANT_ID: '11111111-1111-4111-8111-111111111111',
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  NEXTAUTH_SECRET: 'secret',
  NEXTAUTH_URL: 'http://localhost:3000',
  STORAGE_ENDPOINT: 'http://localhost:9000',
  STORAGE_REGION: 'us-east-1',
  STORAGE_BUCKET: 'lab-platform',
  STORAGE_ACCESS_KEY_ID: 'key',
  STORAGE_SECRET_ACCESS_KEY: 'secret',
  STORAGE_FORCE_PATH_STYLE: 'true',
  STORAGE_PUBLIC_BASE_URL: 'http://localhost:9000/lab-platform',
};

describe('parseEnv', () => {
  it('accepts a fully-populated, valid environment', () => {
    const env = parseEnv(validEnv);
    expect(env.TENANT_ID).toBe(validEnv.TENANT_ID);
    expect(env.STORAGE_FORCE_PATH_STYLE).toBe(true);
  });

  it('rejects a non-UUID TENANT_ID', () => {
    expect(() => parseEnv({ ...validEnv, TENANT_ID: 'not-a-uuid' })).toThrow(/TENANT_ID/);
  });

  it('rejects a missing DATABASE_URL', () => {
    const rest: Record<string, string | undefined> = { ...validEnv };
    delete rest.DATABASE_URL;
    expect(() => parseEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('rejects an invalid NEXTAUTH_URL', () => {
    expect(() => parseEnv({ ...validEnv, NEXTAUTH_URL: 'not-a-url' })).toThrow(/NEXTAUTH_URL/);
  });

  it('reports every missing field at once, not just the first', () => {
    expect(() => parseEnv({})).toThrow(/TENANT_ID[\s\S]*DATABASE_URL/);
  });
});
