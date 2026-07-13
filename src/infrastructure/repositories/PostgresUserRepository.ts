import type { User } from '@/domain/entities/User';
import type { IUserRepository, NewUserInput, UserPatch } from '@/domain/repositories/IUserRepository';
import { withTenantScope } from '../db/client';
import { idToRole, roleToId } from '../db/lookupMaps';

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role_id: number;
  display_name: string;
  must_reset_password: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
}

function toEntity(row: UserRow): User {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    passwordHash: row.password_hash,
    role: idToRole(row.role_id),
    displayName: row.display_name,
    mustResetPassword: row.must_reset_password,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export class PostgresUserRepository implements IUserRepository {
  async findById(tenantId: string, id: string): Promise<User | null> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<UserRow>('SELECT * FROM users WHERE tenant_id = $1 AND id = $2', [
        tenantId,
        id,
      ]);
      return result.rows[0] ? toEntity(result.rows[0]) : null;
    });
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<UserRow>('SELECT * FROM users WHERE tenant_id = $1 AND email = $2', [
        tenantId,
        email,
      ]);
      return result.rows[0] ? toEntity(result.rows[0]) : null;
    });
  }

  async listByTenant(tenantId: string): Promise<User[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<UserRow>(
        'SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at ASC',
        [tenantId],
      );
      return result.rows.map(toEntity);
    });
  }

  async create(input: NewUserInput): Promise<User> {
    return withTenantScope(input.tenantId, async (client) => {
      const result = await client.query<UserRow>(
        `INSERT INTO users (tenant_id, email, password_hash, role_id, display_name, must_reset_password, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          input.tenantId,
          input.email,
          input.passwordHash,
          roleToId(input.role),
          input.displayName,
          input.mustResetPassword ?? true,
          input.createdBy ?? null,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('Failed to create user');
      }
      return toEntity(row);
    });
  }

  async update(tenantId: string, id: string, patch: UserPatch): Promise<User> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<UserRow>(
        `UPDATE users SET
           display_name = COALESCE($3, display_name),
           role_id = COALESCE($4, role_id),
           is_active = COALESCE($5, is_active)
         WHERE tenant_id = $1 AND id = $2
         RETURNING *`,
        [tenantId, id, patch.displayName, patch.role ? roleToId(patch.role) : null, patch.isActive],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error(`User not found: ${id}`);
      }
      return toEntity(row);
    });
  }

  async setPasswordHash(
    tenantId: string,
    id: string,
    passwordHash: string,
    mustResetPassword: boolean,
  ): Promise<void> {
    await withTenantScope(tenantId, async (client) => {
      await client.query(
        `UPDATE users SET password_hash = $3, must_reset_password = $4 WHERE tenant_id = $1 AND id = $2`,
        [tenantId, id, passwordHash, mustResetPassword],
      );
    });
  }
}
