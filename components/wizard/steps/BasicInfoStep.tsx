'use client';
import { Info } from 'lucide-react';
import type { QuestionnaireData } from '../../../types';
import { MOTIVATIONS } from '../../../constants';
import { toggleArrayPatch } from './inputs';

interface Props {
  data: Partial<QuestionnaireData>;
  onChange: (patch: Partial<QuestionnaireData>) => void;
}

export function BasicInfoStep({ data, onChange }: Props) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 px-8 py-4 flex items-center gap-3">
        <Info className="w-5 h-5 text-blue-400" />
        <h4 className="text-white font-bold">A. 방문동기 및 기초 이력 (기본 정보)</h4>
      </div>
      <div className="p-8 space-y-10">
        <div>
          <p className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 bg-slate-800 text-white rounded flex items-center justify-center text-[10px]">1</span>
            방문동기 (중복 체크 가능)
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {MOTIVATIONS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => onChange(toggleArrayPatch(data, 'visit_motives', m))}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${data.visit_motives?.includes(m) ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 hover:border-blue-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
          {data.visit_motives?.includes('소개를 받고') && (
            <input
              className="mt-3 w-full p-3 bg-blue-50 border border-blue-100 rounded-xl outline-none text-sm font-bold"
              placeholder="소개자 성함을 입력해주세요"
              value={data.visit_motives_intro_name || ''}
              onChange={e => onChange({ visit_motives_intro_name: e.target.value })}
            />
          )}
          {data.visit_motives?.includes('기타') && (
            <input
              className="mt-3 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
              placeholder="기타 동기를 입력해주세요"
              value={data.visit_motives_other || ''}
              onChange={e => onChange({ visit_motives_other: e.target.value })}
            />
          )}
        </div>
      </div>
    </section>
  );
}
