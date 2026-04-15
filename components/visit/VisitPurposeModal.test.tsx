import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisitPurposeModal } from './VisitPurposeModal';

describe('VisitPurposeModal', () => {
  it('FITTING 선택 시 "신규 구매 사이클" 토글 노출', () => {
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={['cycle-1']} onSubmit={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /보청기 피팅/ }));
    expect(screen.getByLabelText(/신규 구매 사이클/)).toBeInTheDocument();
  });
  it('신규 구매 사이클 토글 on → purchase_cycle_id=cycle-2, session=1', () => {
    const fn = vi.fn();
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={['cycle-1']} onSubmit={fn} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /보청기 피팅/ }));
    fireEvent.click(screen.getByLabelText(/신규 구매 사이클/));
    fireEvent.click(screen.getByRole('button', { name: '1차' }));
    fireEvent.click(screen.getByRole('button', { name: /상담 시작/ }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      visit_purpose: 'FITTING',
      fitting_session_no: 1,
      purchase_cycle_id: 'cycle-2',
    }));
  });
  it('부차 목적 memo 입력 시 primary_purpose_memo로 저장', () => {
    const fn = vi.fn();
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={[]} onSubmit={fn} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /AS · 수리/ }));
    fireEvent.change(screen.getByPlaceholderText(/부차 목적/), { target: { value: '청력재검 겸' } });
    fireEvent.click(screen.getByRole('button', { name: /상담 시작/ }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      visit_purpose: 'SERVICE',
      primary_purpose_memo: '청력재검 겸',
    }));
  });
  it('REFUND_EXCHANGE 선택 시 단계 필드 없이 저장', () => {
    const fn = vi.fn();
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={[]} onSubmit={fn} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /반품 · 교환/ }));
    fireEvent.click(screen.getByRole('button', { name: /상담 시작/ }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ visit_purpose: 'REFUND_EXCHANGE' }));
  });
});
