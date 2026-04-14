'use client';
import type { QuestionnaireData } from '../../../types';

type Patch = Partial<QuestionnaireData>;
type OnChange = (patch: Patch) => void;

export function makeRenderScale(data: Partial<QuestionnaireData>, onChange: OnChange) {
  return function renderScale(field: keyof QuestionnaireData, label: string) {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
        <span className="text-sm font-semibold text-slate-700 mb-2 md:mb-0 md:max-w-[70%]">{label}</span>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ [field]: val } as Patch)}
              className={`w-10 h-10 rounded-lg border font-bold text-sm transition-all ${data[field] === val ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200'}`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    );
  };
}

export function makeRenderYesNoUnknown(data: Partial<QuestionnaireData>, onChange: OnChange) {
  return function renderYesNoUnknown(field: keyof QuestionnaireData, label: string) {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="flex gap-2">
          {['예', '아니오', '모름'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ [field]: opt } as Patch)}
              className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${data[field] === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };
}

export function toggleArrayPatch<K extends keyof QuestionnaireData>(
  data: Partial<QuestionnaireData>,
  field: K,
  item: string
): Patch {
  const current = (data[field] as unknown as string[] | undefined) || [];
  const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
  return { [field]: next } as Patch;
}
