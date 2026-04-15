import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StageRowExtensible } from './StageRowExtensible';

describe('StageRowExtensible — FITTING', () => {
  it('1~4차 버튼 표시', () => {
    render(<StageRowExtensible mode="fitting" value={null} onChange={() => {}} />);
    ['1차', '2차', '3차', '4차'].forEach(l => expect(screen.getByRole('button', { name: l })).toBeInTheDocument());
  });
  it('+ 추가 클릭 시 5차 생성', () => {
    const { rerender } = render(<StageRowExtensible mode="fitting" value={null} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ 추가/ }));
    rerender(<StageRowExtensible mode="fitting" value={null} onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: '5차' })).toBeInTheDocument();
  });
});

describe('StageRowExtensible — AFTERCARE', () => {
  it('M3/M6/M12/LONGTERM 버튼 표시', () => {
    render(<StageRowExtensible mode="aftercare" value={null} onChange={() => {}} />);
    ['3개월', '6개월', '12개월', '장기(24+)'].forEach(l =>
      expect(screen.getByRole('button', { name: l })).toBeInTheDocument());
  });
  it('LONGTERM 선택 시 custom input 노출', () => {
    render(<StageRowExtensible mode="aftercare" value="LONGTERM" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/직접 입력/)).toBeInTheDocument();
  });
  it('custom input 값 변경 시 onChange에 bucket+month 전달', () => {
    const fn = vi.fn();
    render(<StageRowExtensible mode="aftercare" value="LONGTERM" onChange={fn} />);
    fireEvent.change(screen.getByPlaceholderText(/직접 입력/), { target: { value: '36' } });
    expect(fn).toHaveBeenCalledWith({ bucket: 'LONGTERM', month: 36 });
  });
});
