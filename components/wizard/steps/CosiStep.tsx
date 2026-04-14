'use client';
import { Target } from 'lucide-react';
import type { QuestionnaireData, CosiGoal } from '../../../types';
import { COSI_CATEGORIES } from '../../../constants';

interface Props {
  data: Partial<QuestionnaireData>;
  onChange: (patch: Partial<QuestionnaireData>) => void;
}

export function CosiStep({ data, onChange }: Props) {
  const handleCosiGoal = (category: string, note: string) => {
    const current = data.cosi_top3_goals || [];
    const idx = current.findIndex(g => g.category === category);
    let next: CosiGoal[] = [...current];
    if (idx > -1) {
      if (!note && category === '기타') next = next.filter((_, i) => i !== idx);
      else next[idx] = { category, note };
    } else {
      if (next.length < 3) next.push({ category, note });
      else alert('목표는 최대 3개까지만 설정 가능합니다.');
    }
    onChange({ cosi_top3_goals: next });
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-orange-600 px-8 py-4 flex items-center gap-3">
        <Target className="w-5 h-5 text-white" />
        <h4 className="text-white font-bold">E. 개인 목표 설정 (COSI) - 개선 희망 상황 TOP 3</h4>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(num => {
            const currentGoal = data.cosi_top3_goals?.[num - 1];
            return (
              <div key={num} className="p-6 bg-orange-50/50 border-2 border-orange-100 rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">
                    {num}
                  </span>
                  <span className="text-xs font-black text-orange-900 uppercase">Priority Goal</span>
                </div>
                <select
                  className="w-full p-3 bg-white border border-orange-200 rounded-xl text-xs font-bold outline-none"
                  value={currentGoal?.category || ''}
                  onChange={e => handleCosiGoal(e.target.value, currentGoal?.note || '')}
                >
                  <option value="">카테고리 선택</option>
                  {COSI_CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <textarea
                  className="w-full p-4 bg-white border border-orange-200 rounded-xl text-xs min-h-[120px] outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="구체적인 상황을 적어주세요 (예: 주말 저녁 가족 식사 시 아들 목소리가 잘 안 들림)"
                  value={currentGoal?.note || ''}
                  onChange={e => handleCosiGoal(currentGoal?.category || '기타', e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
