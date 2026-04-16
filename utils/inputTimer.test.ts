import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputTimer } from './inputTimer';

describe('InputTimer', () => {
  beforeEach(() => { localStorage.clear(); });

  it('records a session duration', () => {
    vi.useFakeTimers();
    const t = new InputTimer('questionnaire');
    t.start();
    vi.advanceTimersByTime(5000);
    t.stop();
    const sessions = t.readAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].durationMs).toBe(5000);
    vi.useRealTimers();
  });

  it('computes median across sessions', () => {
    vi.useFakeTimers();
    const t = new InputTimer('questionnaire');
    for (const ms of [1000, 3000, 5000, 7000, 9000]) {
      t.start();
      vi.advanceTimersByTime(ms);
      t.stop();
    }
    expect(t.median()).toBe(5000);
    vi.useRealTimers();
  });
});
