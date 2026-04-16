import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JourneyDashboard } from './JourneyDashboard';
import type { JourneyVisitInput } from '../../utils/journeyState';

const visits: JourneyVisitInput[] = [
  { id: 'v1', visit_date: '2026-02-01', visit_type: 'HA_PROTOCOL', ha_stage: 'HA_1', completed: true },
  { id: 'v2', visit_date: '2026-03-01', visit_type: 'HA_PROTOCOL', ha_stage: 'HA_2', completed: false },
];

describe('JourneyDashboard', () => {
  it('shows current stage badge', () => {
    render(<JourneyDashboard visits={visits} />);
    expect(screen.getByText(/HA_2/)).toBeInTheDocument();
  });
  it('shows next action hint', () => {
    render(<JourneyDashboard visits={visits} />);
    expect(screen.getByText(/남은 체크항목을 완료/)).toBeInTheDocument();
  });
  it('renders a timeline event per visit', () => {
    render(<JourneyDashboard visits={visits} />);
    expect(screen.getAllByTestId('journey-event')).toHaveLength(2);
  });
  it('shows empty state with no visits', () => {
    render(<JourneyDashboard visits={[]} />);
    expect(screen.getByText(/방문 기록 없음/)).toBeInTheDocument();
  });
});
