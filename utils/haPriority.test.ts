import { describe, it, expect } from 'vitest';
import { selectTopPriorities } from './haPriority';

const items = [
  { id: '1', stage: 'HA_1' as const, priority: 1, status: 'PENDING' as const },
  { id: '2', stage: 'HA_1' as const, priority: 2, status: 'PENDING' as const },
  { id: '3', stage: 'HA_1' as const, priority: 3, status: 'DONE' as const },
  { id: '4', stage: 'HA_1' as const, priority: 4, status: 'PENDING' as const },
  { id: '5', stage: 'HA_1' as const, priority: 5, status: 'PENDING' as const },
  { id: '6', stage: 'HA_1' as const, priority: 6, status: 'PENDING' as const },
  { id: '7', stage: 'HA_2' as const, priority: 1, status: 'PENDING' as const },
];

describe('selectTopPriorities', () => {
  it('returns up to 5 pending items from current stage', () => {
    const top = selectTopPriorities(items, 'HA_1', 5);
    expect(top.map(i => i.id)).toEqual(['1', '2', '4', '5', '6']);
  });
  it('returns 3 when limit=3', () => {
    expect(selectTopPriorities(items, 'HA_1', 3)).toHaveLength(3);
  });
  it('excludes DONE items', () => {
    expect(selectTopPriorities(items, 'HA_1', 5).find(i => i.id === '3')).toBeUndefined();
  });
  it('excludes other stages', () => {
    expect(selectTopPriorities(items, 'HA_1', 5).find(i => i.id === '7')).toBeUndefined();
  });
});
