import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopPriorityPanel } from './TopPriorityPanel';

const items = [
  { id: '1', title: '고막 검사', stage: 'HA_1' as const, priority: 1, status: 'PENDING' as const, description: '이경 검사' },
  { id: '2', title: '청력 재확인', stage: 'HA_1' as const, priority: 2, status: 'PENDING' as const, description: '' },
];

describe('TopPriorityPanel', () => {
  it('renders top items with titles', () => {
    render(<TopPriorityPanel items={items} stage="HA_1" limit={5} onToggle={vi.fn()} />);
    expect(screen.getByText('고막 검사')).toBeInTheDocument();
    expect(screen.getByText('청력 재확인')).toBeInTheDocument();
  });

  it('calls onToggle with item id when checkbox clicked', () => {
    const onToggle = vi.fn();
    render(<TopPriorityPanel items={items} stage="HA_1" limit={5} onToggle={onToggle} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(onToggle).toHaveBeenCalledWith('1');
  });
});
