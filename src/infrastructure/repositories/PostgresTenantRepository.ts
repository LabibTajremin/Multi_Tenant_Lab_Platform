import type { Tenant } from '@/domain/entities/Tenant';
import type { ITenantRepository, NewTenantInput, TenantPatch } from '@/domain/repositories/ITenantRepository';
import { getPool } from '../db/client';

interface TenantRow {
  id: string;
  slug: string;
  lab_name: string;
  university: string | null;
  logo_url: string | null;
  theme: string;
  primary_color: string | null;
  custom_domain: string | null;
  review_enabled: boolean;
  created_at: Date;
}

function toEntity(row: TenantRow): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    labName: row.lab_name,
    university: row.university,
    logoUrl: row.logo_url,
    theme: row.theme,
    primaryColor: row.primary_color,
    customDomain: row.custom_domain,
    reviewEnabled: row.review_enabled,
    createdAt: row.created_at,
  };
}

// tenants is the root table (it defines what a tenant IS), so unlike every other
// repository it is not itself scoped by a tenant_id column — there is no RLS
// policy on this table (Section 4.4 lists the tenant-scoped tables explicitly,
// and tenants is not one of them).
export class PostgresTenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const result = await getPool().query<TenantRow>('SELECT * FROM tenants WHERE id = $1', [id]);
    return result.rows[0] ? toEntity(result.rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const result = await getPool().query<TenantRow>('SELECT * FROM tenants WHERE slug = $1', [slug]);
    return result.rows[0] ? toEntity(result.rows[0]) : null;
  }

  async create(input: NewTenantInput): Promise<Tenant> {
    const result = await getPool().query<TenantRow>(
      `INSERT INTO tenants (slug, lab_name, university, theme, primary_color)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.slug, input.labName, input.university ?? null, input.theme ?? 'default', input.primaryColor ?? null],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Failed to create tenant');
    }
    return toEntity(row);
  }

  async update(id: string, patch: TenantPatch): Promise<Tenant> {
    const result = await getPool().query<TenantRow>(
      `UPDATE tenants SET
         lab_name = COALESCE($2, lab_name),
         university = COALESCE($3, university),
         logo_url = COALESCE($4, logo_url),
         theme = COALESCE($5, theme),
         primary_color = COALESCE($6, primary_color),
         custom_domain = COALESCE($7, custom_domain)
       WHERE id = $1
       RETURNING *`,
      [id, patch.labName, patch.university, patch.logoUrl, patch.theme, patch.primaryColor, patch.customDomain],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Tenant not found: ${id}`);
    }
    return toEntity(row);
  }

  async setReviewEnabled(id: string, enabled: boolean): Promise<Tenant> {
    const result = await getPool().query<TenantRow>(
      `UPDATE tenants SET review_enabled = $2 WHERE id = $1 RETURNING *`,
      [id, enabled],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Tenant not found: ${id}`);
    }
    return toEntity(row);
  }
}
