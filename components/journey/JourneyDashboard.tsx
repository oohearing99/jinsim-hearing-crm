'use client';
import { calculateJourneyState, type JourneyVisitInput } from '../../utils/journeyState';
import { ArrowRight, CheckCircle, Circle } from 'lucide-react';

interface Props {
  visits: JourneyVisitInput[];
}

export function JourneyDashboard({ visits }: Props) {
  const { currentStage, timeline, nextActionHint } = calculateJourneyState(visits);

  return (
    <section className="rounded-3xl bg-slate-900 text-white p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
          환자 여정
        </span>
        {currentStage && (
          <span className="px-3 py-1 rounded-full bg-blue-500 text-xs font-bold">
            {currentStage}
          </span>
        )}
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        {timeline.length === 0 ? (
          <span className="text-slate-400 text-sm">방문 기록 없음</span>
        ) : (
          timeline.map((e, idx) => (
            <div key={e.id} data-testid="journey-event" className="flex items-center gap-2">
              {e.completed ? (
                <CheckCircle size={18} className="text-emerald-400" />
              ) : (
                <Circle size={18} className="text-slate-500" />
              )}
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">{e.date}</span>
                <span className="text-sm font-semibold">{e.label}</span>
              </div>
              {idx < timeline.length - 1 && <ArrowRight size={16} className="text-slate-500" />}
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl bg-slate-800 p-3 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-300">다음 액션</span>
        <span className="text-sm font-semibold">{nextActionHint}</span>
      </div>
    </section>
  );
}
