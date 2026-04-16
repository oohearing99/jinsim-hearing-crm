'use client';
import { useState } from 'react';
import type { VisitPurpose, AftercareBucket, Visit } from '../../types';
import { PurposeGrid } from './PurposeGrid';
import { StageRowExtensible } from './StageRowExtensible';

export type NewVisitPayload = Partial<Visit> & { visit_purpose: VisitPurpose };

interface Props {
  customerId: string;
  existingPurchaseCycles: string[];
  onSubmit: (v: NewVisitPayload) => void;
  onCancel: () => void;
}

export function VisitPurposeModal({ customerId, existingPurchaseCycles, onSubmit, onCancel }: Props) {
  const [purpose, setPurpose] = useState<VisitPurpose | null>(null);
  const [fittingSession, setFittingSession] = useState<number | null>(null);
  const [aftercareBucket, setAftercareBucket] = useState<AftercareBucket | null>(null);
  const [aftercareMonth, setAftercareMonth] = useState<number | null>(null);
  const [newCycle, setNewCycle] = useState(false);
  const [memo, setMemo] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = () => {
    if (!purpose) return;
    const base: NewVisitPayload = {
      customer_id: customerId,
      visit_date: visitDate,
      visit_purpose: purpose,
      visit_motives: [],
      primary_purpose_memo: memo || undefined,
    };
    if (purpose === 'FITTING') {
      const nextCycleIdx = existingPurchaseCycles.length + 1;
      const cycleId = newCycle
        ? `cycle-${nextCycleIdx}`
        : (existingPurchaseCycles[existingPurchaseCycles.length - 1] ?? 'cycle-1');
      base.fitting_session_no = fittingSession ?? 1;
      base.purchase_cycle_id = cycleId;
    }
    if (purpose === 'AFTERCARE') {
      base.aftercare_bucket = aftercareBucket ?? 'M3';
      base.aftercare_month = aftercareMonth ?? 3;
    }
    onSubmit(base);
  };

  return (
    <div className="bg-white p-6 rounded-lg max-w-2xl space-y-4">
      <h2 className="text-lg font-bold">새 상담/프로토콜 시작</h2>
      <section>
        <label className="block mb-2 font-semibold">방문 목적</label>
        <PurposeGrid value={purpose} onChange={setPurpose} />
      </section>
      {purpose === 'FITTING' && (
        <section>
          <label className="block mb-2 font-semibold">피팅 차수</label>
          <label htmlFor="new-cycle-toggle" className="flex items-center gap-2 mb-2">
            <input
              id="new-cycle-toggle"
              type="checkbox"
              checked={newCycle}
              onChange={e => setNewCycle(e.target.checked)}
            />
            신규 구매 사이클 (재구매)
          </label>
          <StageRowExtensible
            mode="fitting"
            value={fittingSession}
            onChange={c => setFittingSession(c.session)}
          />
        </section>
      )}
      {purpose === 'AFTERCARE' && (
        <section>
          <label className="block mb-2 font-semibold">사후관리 시점</label>
          <StageRowExtensible
            mode="aftercare"
            value={aftercareBucket}
            onChange={c => { setAftercareBucket(c.bucket); setAftercareMonth(c.month); }}
          />
        </section>
      )}
      <section>
        <label className="block mb-1 font-semibold">방문 날짜</label>
        <input
          type="date"
          value={visitDate}
          onChange={e => setVisitDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </section>
      <section>
        <label className="block mb-1 font-semibold">부차 목적 / 메모</label>
        <textarea
          placeholder="부차 목적 (예: 청력재검 겸)"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          className="w-full border rounded p-2"
          rows={2}
        />
      </section>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!purpose}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          상담 시작 →
        </button>
      </div>
    </div>
  );
}
