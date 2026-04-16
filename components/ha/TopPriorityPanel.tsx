'use client';
import { selectTopPriorities, type PrioritizableItem } from '../../utils/haPriority';
import type { HAStage } from '../../types';

interface Item extends PrioritizableItem {
  title: string;
  description?: string;
}

interface Props {
  items: Item[];
  stage: HAStage;
  limit: number;
  onToggle: (id: string) => void;
}

export function TopPriorityPanel({ items, stage, limit, onToggle }: Props) {
  const top = selectTopPriorities(items, stage, limit);
  if (top.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
        <span className="font-bold">✓ {stage} 단계 필수 체크 완료</span>
      </div>
    );
  }
  return (
    <section className="rounded-2xl bg-white border-2 border-blue-300 p-4 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
          지금 해야 할 일 · Top {top.length}
        </h3>
        <span className="text-xs text-slate-500">{stage} 단계</span>
      </header>
      <ul className="flex flex-col gap-2">
        {top.map((item, idx) => (
          <li key={item.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50">
            <input
              type="checkbox"
              checked={false}
              onChange={() => onToggle(item.id)}
              className="mt-1 w-5 h-5 rounded"
              aria-label={item.title}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-semibold">{item.title}</span>
              </div>
              {item.description && (
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
