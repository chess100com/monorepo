import { describe, it, expect } from 'vitest';
import { calcElo, ELO_K } from '../src/elo-calc.js';

describe('calcElo', () => {
  it('splits K exactly in half on a draw between equal-rated players', () => {
    const r = calcElo(1500, 1500, 0.5);
    expect(r.whiteAfter).toBe(1500);
    expect(r.blackAfter).toBe(1500);
  });

  it('equal-rated win gives K/2 points to the winner and takes K/2 from the loser', () => {
    const r = calcElo(1500, 1500, 1);
    expect(r.whiteAfter).toBe(1500 + ELO_K / 2);
    expect(r.blackAfter).toBe(1500 - ELO_K / 2);
  });

  it('equal-rated loss is symmetric to the win case', () => {
    const r = calcElo(1500, 1500, 0);
    expect(r.whiteAfter).toBe(1500 - ELO_K / 2);
    expect(r.blackAfter).toBe(1500 + ELO_K / 2);
  });

  it('upset gain is larger when the lower-rated side wins', () => {
    // 1400 white beating 1600 black: expected white ≈ 0.24, gain ≈ K*0.76 ≈ 24
    const upset = calcElo(1400, 1600, 1);
    const even = calcElo(1500, 1500, 1);
    const delta = upset.whiteAfter - 1400;
    expect(delta).toBeGreaterThan(even.whiteAfter - 1500);
    expect(upset.whiteAfter + upset.blackAfter).toBe(1400 + 1600);
  });

  it('zero-sum: white gain equals black loss', () => {
    const r = calcElo(1720, 1480, 1);
    expect(r.whiteAfter - 1720).toBe(1480 - r.blackAfter);
  });

  it('favorite win yields a small gain', () => {
    const r = calcElo(2000, 1500, 1);
    const gain = r.whiteAfter - 2000;
    expect(gain).toBeGreaterThan(0);
    expect(gain).toBeLessThan(ELO_K / 2);
  });

  it('honours a custom K factor', () => {
    const r = calcElo(1500, 1500, 1, 16);
    expect(r.whiteAfter).toBe(1508);
    expect(r.blackAfter).toBe(1492);
  });
});
