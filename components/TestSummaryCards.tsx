import React from 'react';
import { Activity, Headphones } from 'lucide-react';

interface Props {
  visitId: string;
  onNavigateToTab: (tab: 'PTA' | 'SPEECH') => void;
}

interface TestSummary {
  label: string;
  icon: React.ElementType;
  tab: 'PTA' | 'SPEECH';
  getData: () => { hasData: boolean; summary: React.ReactNode };
}

function getPtaSummary(visitId: string): { hasData: boolean; summary: React.ReactNode } {
  const raw = localStorage.getItem(`pta_${visitId}`);
  if (!raw) return { hasData: false, summary: null };

  try {
    const data = JSON.parse(raw);
    const freqs = data.frequencies || {};
    const ptaFreqs = ['500', '1000', '2000', '4000'];
    let rightSum = 0, rightCount = 0, leftSum = 0, leftCount = 0;

    for (const f of ptaFreqs) {
      if (freqs[f]?.rt_ac != null) { rightSum += freqs[f].rt_ac; rightCount++; }
      if (freqs[f]?.lt_ac != null) { leftSum += freqs[f].lt_ac; leftCount++; }
    }

    if (rightCount === 0 && leftCount === 0) return { hasData: false, summary: null };

    const rightPta = rightCount > 0 ? Math.round(rightSum / rightCount) : null;
    const leftPta = leftCount > 0 ? Math.round(leftSum / leftCount) : null;

    const getGrade = (pta: number) => {
      if (pta <= 25) return '정상';
      if (pta <= 40) return '경도';
      if (pta <= 55) return '중등도';
      if (pta <= 70) return '중등고도';
      if (pta <= 90) return '고도';
      return '심도';
    };

    return {
      hasData: true,
      summary: (
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">우측 PTA</div>
            <div className="text-xl font-black text-red-500">{rightPta ?? '—'}</div>
            <div className="text-[9px] text-slate-400">{rightPta != null ? getGrade(rightPta) : ''}</div>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">좌측 PTA</div>
            <div className="text-xl font-black text-blue-500">{leftPta ?? '—'}</div>
            <div className="text-[9px] text-slate-400">{leftPta != null ? getGrade(leftPta) : ''}</div>
          </div>
        </div>
      ),
    };
  } catch {
    return { hasData: false, summary: null };
  }
}

function getSpeechSummary(visitId: string): { hasData: boolean; summary: React.ReactNode } {
  const raw = localStorage.getItem(`speech_${visitId}`);
  if (!raw) return { hasData: false, summary: null };

  try {
    const data = JSON.parse(raw);
    const rightWrs = data.rt?.wrs_percent?.[0] ?? null;
    const leftWrs = data.lt?.wrs_percent?.[0] ?? null;

    if (rightWrs == null && leftWrs == null) return { hasData: false, summary: null };

    return {
      hasData: true,
      summary: (
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">우 WRS</div>
            <div className="text-xl font-black text-red-500">{rightWrs != null ? `${rightWrs}%` : '—'}</div>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">좌 WRS</div>
            <div className="text-xl font-black text-blue-500">{leftWrs != null ? `${leftWrs}%` : '—'}</div>
          </div>
        </div>
      ),
    };
  } catch {
    return { hasData: false, summary: null };
  }
}

export default function TestSummaryCards({ visitId, onNavigateToTab }: Props) {
  const tests: TestSummary[] = [
    {
      label: '순음청력검사',
      icon: Activity,
      tab: 'PTA',
      getData: () => getPtaSummary(visitId),
    },
    {
      label: '어음검사',
      icon: Headphones,
      tab: 'SPEECH',
      getData: () => getSpeechSummary(visitId),
    },
  ];

  return (
    <div className="space-y-4">
      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">검사 결과 요약</h5>
      <div className="grid grid-cols-2 gap-4">
        {tests.map((test) => {
          const Icon = test.icon;
          const { hasData, summary } = test.getData();

          if (hasData) {
            return (
              <div
                key={test.label}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => onNavigateToTab(test.tab)}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-black text-slate-700">{test.label}</span>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold cursor-pointer">상세 보기 →</span>
                </div>
                {summary}
              </div>
            );
          }

          return (
            <div
              key={test.label}
              className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-300 transition-all"
              onClick={() => onNavigateToTab(test.tab)}
            >
              <Icon className="w-5 h-5 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-black text-slate-400">{test.label}</div>
              <div className="text-[11px] text-slate-300 mt-1">— 미입력 —</div>
              <span className="text-[10px] text-blue-500 font-bold mt-2 inline-block">입력하기 →</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
