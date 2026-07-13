import { describe, expect, it } from 'vitest';
import {
  compareMembersForDisplay,
  isMemberPosition,
  MEMBER_POSITION_LABELS,
  MEMBER_POSITIONS,
  sortRankOf,
} from './MemberPosition';

describe('sortRankOf', () => {
  it('ranks PI first and Alumnus last', () => {
    expect(sortRankOf('PI')).toBe(1);
    expect(sortRankOf('Alumnus')).toBe(6);
    expect(sortRankOf('PI')).toBeLessThan(sortRankOf('Postdoc'));
    expect(sortRankOf('Postdoc')).toBeLessThan(sortRankOf('PhD'));
    expect(sortRankOf('PhD')).toBeLessThan(sortRankOf('MS'));
    expect(sortRankOf('MS')).toBeLessThan(sortRankOf('Undergrad'));
    expect(sortRankOf('Undergrad')).toBeLessThan(sortRankOf('Alumnus'));
  });
});

describe('compareMembersForDisplay', () => {
  it('sorts by position rank first', () => {
    const alumnus = { position: 'Alumnus' as const, sortOrder: 0 };
    const pi = { position: 'PI' as const, sortOrder: 0 };
    expect(compareMembersForDisplay(pi, alumnus)).toBeLessThan(0);
    expect(compareMembersForDisplay(alumnus, pi)).toBeGreaterThan(0);
  });

  it('breaks ties within the same position by sortOrder', () => {
    const first = { position: 'PhD' as const, sortOrder: 1 };
    const second = { position: 'PhD' as const, sortOrder: 2 };
    expect(compareMembersForDisplay(first, second)).toBeLessThan(0);
    expect(compareMembersForDisplay(second, first)).toBeGreaterThan(0);
  });

  it('produces a stable ordering across a mixed roster', () => {
    const roster = [
      { position: 'Alumnus' as const, sortOrder: 0, name: 'z' },
      { position: 'PI' as const, sortOrder: 0, name: 'a' },
      { position: 'PhD' as const, sortOrder: 2, name: 'c' },
      { position: 'PhD' as const, sortOrder: 1, name: 'b' },
    ];
    const sorted = [...roster].sort(compareMembersForDisplay);
    expect(sorted.map((m) => m.name)).toEqual(['a', 'b', 'c', 'z']);
  });
});

describe('MEMBER_POSITION_LABELS', () => {
  it('has a human-readable label for every position', () => {
    for (const position of MEMBER_POSITIONS) {
      expect(MEMBER_POSITION_LABELS[position]).toBeTruthy();
    }
  });
});

describe('isMemberPosition', () => {
  it('accepts every known position', () => {
    for (const position of ['PI', 'Postdoc', 'PhD', 'MS', 'Undergrad', 'Alumnus']) {
      expect(isMemberPosition(position)).toBe(true);
    }
  });

  it('rejects an unknown position', () => {
    expect(isMemberPosition('Professor')).toBe(false);
  });
});
