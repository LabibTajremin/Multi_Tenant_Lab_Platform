export type MemberPosition = 'PI' | 'Postdoc' | 'PhD' | 'MS' | 'Undergrad' | 'Alumnus';

// Fixed display order (Section 4.1 / Section 12 /people page: PI first, then
// Postdocs, PhDs, MS, Undergrads, then a collapsible Alumni section).
const SORT_RANK: Record<MemberPosition, number> = {
  PI: 1,
  Postdoc: 2,
  PhD: 3,
  MS: 4,
  Undergrad: 5,
  Alumnus: 6,
};

export const MEMBER_POSITIONS: readonly MemberPosition[] = ['PI', 'Postdoc', 'PhD', 'MS', 'Undergrad', 'Alumnus'];

export function isMemberPosition(value: string): value is MemberPosition {
  return (MEMBER_POSITIONS as readonly string[]).includes(value);
}

export function sortRankOf(position: MemberPosition): number {
  return SORT_RANK[position];
}

/** Comparator for the /people page: group by position rank, then by each member's sortOrder. */
export function compareMembersForDisplay(
  a: { position: MemberPosition; sortOrder: number },
  b: { position: MemberPosition; sortOrder: number },
): number {
  const rankDiff = sortRankOf(a.position) - sortRankOf(b.position);
  if (rankDiff !== 0) {
    return rankDiff;
  }
  return a.sortOrder - b.sortOrder;
}
