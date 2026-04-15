'use client';
import { useState } from 'react';
import type { AftercareBucket } from '../../types';

type FittingChange = { session: number };
type AftercareChange = { bucket: AftercareBucket; month: number };

interface FittingProps {
  mode: 'fitting';
  value: number | null;
  onChange: (c: FittingChange) => void;
}
interface AftercareProps {
  mode: 'aftercare';
  value: AftercareBucket | null;
  onChange: (c: AftercareChange) => void;
}

export function StageRowExtensible(props: FittingProps | AftercareProps) {
  if (props.mode === 'fitting') return <FittingRow {...props} />;
  return <AftercareRow {...props} />;
}

function FittingRow({ value, onChange }: FittingProps) {
  const [maxSession, setMaxSession] = useState(4);
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: maxSession }, (_, i) => i + 1).map(n => (
        <button key={n} type="button"
          aria-pressed={value === n}
          onClick={() => onChange({ session: n })}
          className={`px-3 py-2 border rounded ${value === n ? 'bg-blue-600 text-white' : ''}`}>
          {n}차
        </button>
      ))}
      <button type="button" onClick={() => setMaxSession(m => m + 1)} className="px-3 py-2 border rounded border-dashed">+ 추가</button>
    </div>
  );
}

function AftercareRow({ value, onChange }: AftercareProps) {
  const BUCKETS: { bucket: AftercareBucket; label: string; defaultMonth: number }[] = [
    { bucket: 'M3', label: '3개월', defaultMonth: 3 },
    { bucket: 'M6', label: '6개월', defaultMonth: 6 },
    { bucket: 'M12', label: '12개월', defaultMonth: 12 },
    { bucket: 'LONGTERM', label: '장기(24+)', defaultMonth: 24 },
  ];
  const [customMonth, setCustomMonth] = useState<number>(24);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {BUCKETS.map(b => (
          <button key={b.bucket} type="button"
            aria-pressed={value === b.bucket}
            onClick={() => onChange({ bucket: b.bucket, month: b.defaultMonth })}
            className={`px-3 py-2 border rounded ${value === b.bucket ? 'bg-blue-600 text-white' : ''}`}>
            {b.label}
          </button>
        ))}
      </div>
      {value === 'LONGTERM' && (
        <input type="number" min={13} placeholder="직접 입력 (개월)"
          value={customMonth}
          onChange={e => {
            const m = Number(e.target.value);
            setCustomMonth(m);
            onChange({ bucket: 'LONGTERM', month: m });
          }}
          className="px-2 py-1 border rounded w-40" />
      )}
    </div>
  );
}
