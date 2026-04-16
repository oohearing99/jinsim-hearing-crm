'use client';
import { Activity, ShieldCheck, Info } from 'lucide-react';
import type { QuestionnaireData } from '../../../types';
import { CONCERNS } from '../../../constants';
import { makeRenderScale, makeRenderYesNoUnknown, toggleArrayPatch } from './inputs';

interface Props {
  data: Partial<QuestionnaireData>;
  onChange: (patch: Partial<QuestionnaireData>) => void;
}

export function HearingStep({ data, onChange }: Props) {
  const renderScale = makeRenderScale(data, onChange);
  const renderYesNoUnknown = makeRenderYesNoUnknown(data, onChange);

  return (
    <div className="space-y-12">
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-8 py-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-400" />
          <h4 className="text-white font-bold">A. 청력 프로필 기초</h4>
        </div>
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2">8. 더 잘 들리는 귀</label>
              <select
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold"
                value={data.better_ear || ''}
                onChange={e => onChange({ better_ear: e.target.value })}
              >
                <option value="">선택</option>
                <option value="오른쪽">오른쪽</option>
                <option value="왼쪽">왼쪽</option>
                <option value="비슷함">비슷함</option>
                <option value="모름">모름</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2">9. 보청기 희망 위치</label>
              <select
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold"
                value={data.desired_aid_ear || ''}
                onChange={e => onChange({ desired_aid_ear: e.target.value })}
              >
                <option value="">선택</option>
                <option value="오른쪽">오른쪽</option>
                <option value="왼쪽">왼쪽</option>
                <option value="양쪽">양쪽</option>
                <option value="모름">모름</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2">10. 전화 받는 쪽</label>
              <select
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold"
                value={data.phone_ear || ''}
                onChange={e => onChange({ phone_ear: e.target.value })}
              >
                <option value="">선택</option>
                <option value="오른쪽">오른쪽</option>
                <option value="왼쪽">왼쪽</option>
                <option value="양쪽 번갈아">양쪽 번갈아</option>
                <option value="스피커폰/이어폰">스피커폰/이어폰</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderYesNoUnknown('dexterity_issue', '11. 손 움직임 불편함(섬세한 조작)')}
            <div>
              <label className="block text-xs font-black text-slate-400 mb-2 uppercase">12. 직업 및 취미</label>
              <input
                className="w-full p-3 bg-slate-50 border rounded-xl font-bold"
                value={data.occupation_hobby || ''}
                onChange={e => onChange({ occupation_hobby: e.target.value })}
                placeholder="자유 기입"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-blue-600 px-8 py-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-white" />
          <h4 className="text-white font-bold">B & C. 청취 어려움 및 정서 영향 프로필 (0~3점)</h4>
        </div>
        <div className="p-8">
          <p className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest px-4 border-l-4 border-blue-500">
            0:전혀없음 / 1:가끔 / 2:자주 / 3:항상
          </p>
          <div className="space-y-2">
            <div className="pb-4 border-b border-slate-100 mb-4">
              <p className="text-xs font-black text-blue-600 mb-2 uppercase tracking-widest">B. 청취 어려움 (APHAB)</p>
            </div>
            {renderScale('diff_quiet_1to1', '13. 조용한 곳에서 1:1 대화가 또렷하지 않아 되묻는다.')}
            {renderScale('diff_small_group', '14. 3~4명 정도의 작은 모임에서 대화를 따라가기 어렵다.')}
            {renderScale('diff_background_noise', '15. 식당/카페처럼 시끄러운 곳에서 대화가 특히 어렵다.')}
            {renderScale('diff_party_multi_talkers', '16. 여러 사람이 동시에 말하는 상황에서 말소리가 섞인다.')}
            {renderScale('diff_reverberation_distance', '17. 예배당/강당처럼 울림이 있거나 거리가 멀면 어렵다.')}
            {renderScale('diff_tv_volume', '18. TV/라디오 볼륨을 남들보다 크게 해야 편하다.')}
            {renderScale('diff_phone_speech', '19. 전화 통화에서 상대방 말을 놓치는 경우가 있다.')}

            <div className="py-4 border-b border-slate-100 my-4">
              <p className="text-xs font-black text-orange-600 mb-2 uppercase tracking-widest">
                C. 소리의 불편함 및 사회·정서 영향 (HHIE)
              </p>
            </div>
            {renderScale('aversive_loud_sounds', '20. 접시 부딪힘/알람 등 큰 소리가 너무 고통스럽거나 불쾌하다.')}
            {renderScale('social_withdrawal', '21. 청력 문제 때문에 모임 참여가 줄거나 피하게 된다.')}
            {renderScale('emotional_impact', '22. 청력 문제로 답답함/스트레스/짜증 등을 느낀 적이 있다.')}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-600 px-8 py-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-white" />
          <h4 className="text-white font-bold">D. 보청기 기대 및 우려</h4>
        </div>
        <div className="p-8 space-y-8">
          <div>
            <p className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">23. 보청기 착용 후 기대 수준</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { k: 'A', t: '시끄러운 곳에서도 "대부분 완벽하게" 잘 들리길 기대한다' },
                { k: 'B', t: '전반적으로 "많이" 좋아지길 기대한다(되묻는 횟수 감소)' },
                { k: 'C', t: '"일부 상황만" 개선돼도 만족할 것 같다(TV/가족대화)' },
                { k: 'D', t: '기대 수준을 잘 모르겠다' },
                { k: 'E', t: '기타 (직접 입력)' }
              ].map(opt => (
                <button
                  key={opt.k}
                  type="button"
                  onClick={() => onChange({ expectation_level: opt.k })}
                  className={`p-4 text-left border rounded-2xl transition-all flex items-center gap-4 ${data.expectation_level === opt.k ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-300'}`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${data.expectation_level === opt.k ? 'bg-white text-emerald-600' : 'bg-slate-100'}`}>
                    {opt.k}
                  </span>
                  <span className="text-sm font-bold">{opt.t}</span>
                </button>
              ))}
            </div>
            {data.expectation_level === 'E' && (
              <input
                className="mt-3 w-full p-3 bg-slate-50 border rounded-xl outline-none"
                placeholder="기타 기대사항 입력"
                value={data.expectation_other || ''}
                onChange={e => onChange({ expectation_other: e.target.value })}
              />
            )}
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">
              24. 보청기 착용/구매 시 걱정되는 점 (중복)
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {CONCERNS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(toggleArrayPatch(data, 'concerns_multi', c))}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.concerns_multi?.includes(c) ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-500 hover:border-emerald-300'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
