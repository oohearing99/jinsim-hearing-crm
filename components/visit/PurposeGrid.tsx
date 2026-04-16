'use client';
import type { VisitPurpose } from '../../types';

const OPTIONS: { value: VisitPurpose; label: string }[] = [
  { value: 'INITIAL', label: '초진 상담' },
  { value: 'FITTING', label: '보청기 피팅' },
  { value: 'AFTERCARE', label: '정기 사후관리' },
  { value: 'SERVICE', label: 'AS · 수리' },
  { value: 'REFUND_EXCHANGE', label: '반품 · 교환' },
];

export function PurposeGrid({ value, onChange }: { value: VisitPurpose | null; onChange: (v: VisitPurpose) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="방문 목적">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-3 rounded border ${value === o.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
