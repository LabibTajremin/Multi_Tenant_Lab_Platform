import type { Tenant } from '../entities/Tenant';

export interface NewTenantInput {
  slug: string;
  labName: string;
  university?: string | null;
  theme?: string;
  primaryColor?: string | null;
}

export interface TenantPatch {
  labName?: string;
  university?: string | null;
  logoUrl?: string | null;
  theme?: string;
  primaryColor?: string | null;
  customDomain?: string | null;
}

/**
 * Not tenant-scoped by tenant_id itself (this repository IS how a tenant is
 * resolved) — every deployment only ever calls this with its own TENANT_ID.
 */
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(input: NewTenantInput): Promise<Tenant>;
  update(id: string, patch: TenantPatch): Promise<Tenant>;
  setReviewEnabled(id: string, enabled: boolean): Promise<Tenant>;
}
