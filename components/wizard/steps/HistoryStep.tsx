'use client';
import { Info } from 'lucide-react';
import type { QuestionnaireData } from '../../../types';
import { makeRenderYesNoUnknown } from './inputs';

interface Props {
  data: Partial<QuestionnaireData>;
  onChange: (patch: Partial<QuestionnaireData>) => void;
}

export function HistoryStep({ data, onChange }: Props) {
  const renderYesNoUnknown = makeRenderYesNoUnknown(data, onChange);
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 px-8 py-4 flex items-center gap-3">
        <Info className="w-5 h-5 text-blue-400" />
        <h4 className="text-white font-bold">A. 방문동기 및 기초 이력 (병력)</h4>
      </div>
      <div className="p-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {renderYesNoUnknown('hearing_test_experience', '2. 청력검사 경험')}
            <input
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs"
              placeholder="언제/어디서 받으셨나요?"
              value={data.hearing_test_exp_note || ''}
              onChange={e => onChange({ hearing_test_exp_note: e.target.value })}
            />

            {renderYesNoUnknown('ent_visit_within_1y', '3. 최근 1년 내 이비인후과 방문')}
            <input
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs"
              placeholder="방문 이유/진단 내용"
              value={data.ent_visit_note || ''}
              onChange={e => onChange({ ent_visit_note: e.target.value })}
            />

            {renderYesNoUnknown('hearing_aid_experience', '4. 보청기 상담/착용 경험')}
            <textarea
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs h-20"
              placeholder="착용/상담 시기 및 경험 요약"
              value={data.hearing_aid_exp_note || ''}
              onChange={e => onChange({ hearing_aid_exp_note: e.target.value })}
            />
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">
                5. 발병 시기 (언제부터 잘 안들리셨나요?)
              </label>
              <input
                className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold"
                value={data.hearing_loss_onset_note || ''}
                onChange={e => onChange({ hearing_loss_onset_note: e.target.value })}
                placeholder="예: 5년 전부터 서서히"
              />
            </div>
            {renderYesNoUnknown('ear_disease_treatment_history', '6. 중이염 등 수술/치료 경험')}
            <input
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs"
              placeholder="치료/수술 종류"
              value={data.ear_disease_note || ''}
              onChange={e => onChange({ ear_disease_note: e.target.value })}
            />

            {renderYesNoUnknown('tinnitus', '7. 이명(귀 울림) 증상')}
            <input
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs"
              placeholder="어떤 소리/언제 주로 들리나요?"
              value={data.tinnitus_note || ''}
              onChange={e => onChange({ tinnitus_note: e.target.value })}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
