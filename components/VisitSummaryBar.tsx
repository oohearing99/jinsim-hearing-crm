import React from 'react';
import { Visit, Customer } from '../types';
import { ClipboardList } from 'lucide-react';

interface Props {
  visit: Visit;
  customer: Customer;
  progress: { completed: number; total: number };
}

export default function VisitSummaryBar({ visit, customer, progress }: Props) {
  const stageLabel = visit.ha_stage_label || '일반 상담';
  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="bg-slate-900 px-6 py-4 flex items-center justify-between rounded-t-3xl">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-orange-500" />
        <span className="text-white font-black text-base tracking-tight">{customer.name}</span>
        <span className="text-slate-500 text-sm">·</span>
        <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-blue-400">
          {stageLabel}
        </span>
        <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400">
          {visit.visit_date}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">진행률</span>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-black text-blue-400">{progress.completed}/{progress.total}</span>
      </div>
    </div>
  );
}
