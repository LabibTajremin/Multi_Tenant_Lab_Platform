import type { Member, MemberLink } from '@/domain/entities/Member';
import type { IMemberRepository, MemberPatch, NewMemberInput } from '@/domain/repositories/IMemberRepository';
import type { PoolClient } from 'pg';
import { withTenantScope } from '../db/client';
import { idToPosition, linkPlatformToId, idToLinkPlatform, positionToId } from '../db/lookupMaps';

interface MemberRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  full_name: string;
  photo_url: string | null;
  photo_alt: string | null;
  position_id: number;
  bio: string | null;
  contact_email: string | null;
  join_date: Date | null;
  leave_date: Date | null;
  sort_order: number;
  created_at: Date;
}

interface MemberLinkRow {
  member_id: string;
  platform_id: number;
  url: string;
}

function toEntity(row: MemberRow, links: MemberLink[]): Member {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    fullName: row.full_name,
    photoUrl: row.photo_url,
    photoAlt: row.photo_alt,
    position: idToPosition(row.position_id),
    bio: row.bio,
    contactEmail: row.contact_email,
    joinDate: row.join_date,
    leaveDate: row.leave_date,
    sortOrder: row.sort_order,
    links,
    createdAt: row.created_at,
  };
}

async function fetchLinks(client: PoolClient, memberIds: string[]): Promise<Map<string, MemberLink[]>> {
  const byMember = new Map<string, MemberLink[]>();
  if (memberIds.length === 0) {
    return byMember;
  }
  const result = await client.query<MemberLinkRow>(
    'SELECT member_id, platform_id, url FROM member_links WHERE member_id = ANY($1::uuid[])',
    [memberIds],
  );
  for (const row of result.rows) {
    const links = byMember.get(row.member_id) ?? [];
    links.push({ platform: idToLinkPlatform(row.platform_id), url: row.url });
    byMember.set(row.member_id, links);
  }
  return byMember;
}

export class PostgresMemberRepository implements IMemberRepository {
  async findById(tenantId: string, id: string): Promise<Member | null> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<MemberRow>('SELECT * FROM members WHERE tenant_id = $1 AND id = $2', [
        tenantId,
        id,
      ]);
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      const links = await fetchLinks(client, [row.id]);
      return toEntity(row, links.get(row.id) ?? []);
    });
  }

  async listByTenant(tenantId: string): Promise<Member[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<MemberRow>(
        'SELECT * FROM members WHERE tenant_id = $1 ORDER BY position_id, sort_order',
        [tenantId],
      );
      const links = await fetchLinks(client, result.rows.map((r) => r.id));
      return result.rows.map((row) => toEntity(row, links.get(row.id) ?? []));
    });
  }

  async create(input: NewMemberInput): Promise<Member> {
    return withTenantScope(input.tenantId, async (client) => {
      const result = await client.query<MemberRow>(
        `INSERT INTO members
           (tenant_id, user_id, full_name, photo_url, photo_alt, position_id, bio, contact_email, join_date, leave_date, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          input.tenantId,
          input.userId ?? null,
          input.fullName,
          input.photoUrl ?? null,
          input.photoAlt ?? null,
          positionToId(input.position),
          input.bio ?? null,
          input.contactEmail ?? null,
          input.joinDate ?? null,
          input.leaveDate ?? null,
          input.sortOrder ?? 0,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('Failed to create member');
      }
      if (input.links && input.links.length > 0) {
        await insertLinks(client, row.id, input.links);
      }
      const links = await fetchLinks(client, [row.id]);
      return toEntity(row, links.get(row.id) ?? []);
    });
  }

  async update(tenantId: string, id: string, patch: MemberPatch): Promise<Member> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<MemberRow>(
        `UPDATE members SET
           full_name = COALESCE($3, full_name),
           position_id = COALESCE($4, position_id),
           photo_url = COALESCE($5, photo_url),
           photo_alt = COALESCE($6, photo_alt),
           bio = COALESCE($7, bio),
           contact_email = COALESCE($8, contact_email),
           join_date = COALESCE($9, join_date),
           leave_date = COALESCE($10, leave_date),
           sort_order = COALESCE($11, sort_order)
         WHERE tenant_id = $1 AND id = $2
         RETURNING *`,
        [
          tenantId,
          id,
          patch.fullName,
          patch.position ? positionToId(patch.position) : null,
          patch.photoUrl,
          patch.photoAlt,
          patch.bio,
          patch.contactEmail,
          patch.joinDate,
          patch.leaveDate,
          patch.sortOrder,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error(`Member not found: ${id}`);
      }
      const links = await fetchLinks(client, [row.id]);
      return toEntity(row, links.get(row.id) ?? []);
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await withTenantScope(tenantId, async (client) => {
      await client.query('DELETE FROM members WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
    });
  }

  async setLinks(tenantId: string, memberId: string, links: MemberLink[]): Promise<void> {
    await withTenantScope(tenantId, async (client) => {
      const owns = await client.query('SELECT 1 FROM members WHERE tenant_id = $1 AND id = $2', [
        tenantId,
        memberId,
      ]);
      if (owns.rowCount === 0) {
        throw new Error(`Member not found: ${memberId}`);
      }
      await client.query('DELETE FROM member_links WHERE member_id = $1', [memberId]);
      await insertLinks(client, memberId, links);
    });
  }
}

async function insertLinks(client: PoolClient, memberId: string, links: MemberLink[]): Promise<void> {
  for (const link of links) {
    await client.query(
      'INSERT INTO member_links (member_id, platform_id, url) VALUES ($1, $2, $3)',
      [memberId, linkPlatformToId(link.platform), link.url],
    );
  }
}
