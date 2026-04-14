import { describe, it, expect } from 'vitest';
import { snapToNearestFrequency, pixelToDb, clickToEntry } from './audiogramMapping';

const geom = {
  frequencies: [250, 500, 1000, 2000, 4000, 8000],
  xStart: 60, xEnd: 660,
  yStart: 20, yEnd: 420,
  dbMin: -10, dbMax: 120,
  dbStep: 5,
};

describe('snapToNearestFrequency', () => {
  it('snaps 1100 Hz to 1000 Hz', () => {
    expect(snapToNearestFrequency(1100, geom.frequencies)).toBe(1000);
  });
  it('snaps 3000 Hz to 4000 Hz (log midpoint ≈ 2828, so 3000 is closer to 4000)', () => {
    expect(snapToNearestFrequency(3000, geom.frequencies)).toBe(4000);
  });
});

describe('pixelToDb', () => {
  it('top pixel → dbMin', () => {
    expect(pixelToDb(20, geom)).toBe(-10);
  });
  it('bottom pixel → dbMax', () => {
    expect(pixelToDb(420, geom)).toBe(120);
  });
  it('snaps to 5-dB grid', () => {
    expect(pixelToDb(100, geom) % 5).toBe(0);
  });
});

describe('clickToEntry', () => {
  it('returns {freq, db} for valid click', () => {
    const result = clickToEntry({ x: 360, y: 220 }, geom);
    expect(result).toMatchObject({ freq: expect.any(Number), db: expect.any(Number) });
    expect(geom.frequencies).toContain(result!.freq);
  });
  it('returns null when click outside plot area', () => {
    expect(clickToEntry({ x: 10, y: 10 }, geom)).toBeNull();
  });
});
