import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PurposeGrid } from './PurposeGrid';

describe('PurposeGrid', () => {
  it('5개 카테고리 버튼 렌더', () => {
    render(<PurposeGrid value={null} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /초진 상담/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /보청기 피팅/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /정기 사후관리/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AS · 수리/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /반품 · 교환/ })).toBeInTheDocument();
  });
  it('클릭 시 onChange 호출', () => {
    const fn = vi.fn();
    render(<PurposeGrid value={null} onChange={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /반품 · 교환/ }));
    expect(fn).toHaveBeenCalledWith('REFUND_EXCHANGE');
  });
  it('선택된 버튼은 aria-pressed=true', () => {
    render(<PurposeGrid value="FITTING" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /보청기 피팅/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
