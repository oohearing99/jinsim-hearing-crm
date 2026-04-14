export interface AudiogramGeometry {
  frequencies: number[];
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  dbMin: number;
  dbMax: number;
  dbStep: number;
}

export function snapToNearestFrequency(hz: number, freqs: number[]): number {
  let best = freqs[0];
  let bestDist = Math.abs(Math.log2(hz) - Math.log2(best));
  for (const f of freqs) {
    const d = Math.abs(Math.log2(hz) - Math.log2(f));
    if (d < bestDist) { best = f; bestDist = d; }
  }
  return best;
}

export function pixelToDb(y: number, g: AudiogramGeometry): number {
  const clamped = Math.max(g.yStart, Math.min(g.yEnd, y));
  const ratio = (clamped - g.yStart) / (g.yEnd - g.yStart);
  const db = g.dbMin + ratio * (g.dbMax - g.dbMin);
  return Math.round(db / g.dbStep) * g.dbStep;
}

export function pixelToFrequency(x: number, g: AudiogramGeometry): number {
  const ratio = (x - g.xStart) / (g.xEnd - g.xStart);
  const logMin = Math.log2(g.frequencies[0]);
  const logMax = Math.log2(g.frequencies[g.frequencies.length - 1]);
  const hz = Math.pow(2, logMin + ratio * (logMax - logMin));
  return snapToNearestFrequency(hz, g.frequencies);
}

export function clickToEntry(
  p: { x: number; y: number },
  g: AudiogramGeometry
): { freq: number; db: number } | null {
  if (p.x < g.xStart || p.x > g.xEnd || p.y < g.yStart || p.y > g.yEnd) return null;
  return {
    freq: pixelToFrequency(p.x, g),
    db: pixelToDb(p.y, g),
  };
}
