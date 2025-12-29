
import React, { useState, useEffect } from 'react';
import { Visit, Customer, QuestionnaireData, CosiGoal } from '../types';
import { MOTIVATIONS, CONCERNS, COSI_CATEGORIES, BRAND_ID } from '../constants';
import { Save, Info, Sparkles, MessageSquare, Target, Activity, HeartPulse, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  visit: Visit;
  customer: Customer;
  onSave: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  saveTriggerRef: React.MutableRefObject<() => void>;
}

const QuestionnaireForm: React.FC<Props> = ({ visit, customer, onSave, onDirtyChange, saveTriggerRef }) => {
  const [data, setData] = useState<Partial<QuestionnaireData>>(() => {
    // 고객 ID 기준으로 설문지 데이터 로드 (모든 방문에서 동일한 데이터 공유)
    const savedByCustomer = localStorage.getItem(`q_customer_${customer.id}`);
    const savedByVisit = localStorage.getItem(`q_${visit.id}`);
    const saved = savedByCustomer || savedByVisit;
    return saved ? JSON.parse(saved) : {
      visit_id: visit.id,
      customer_id: customer.id,
      visit_motives: [],
      concerns_multi: [],
      cosi_top3_goals: [],
      created_at: new Date().toISOString()
    };
  });

  const handleSave = () => {
    const fullData: QuestionnaireData = {
      visit_motives: [],
      concerns_multi: [],
      cosi_top3_goals: [],
      ...data,
      brand_id: BRAND_ID,
      center_id: localStorage.getItem('jinsim_pref_center') || 'SEOUL_MAIN',
      counselor_name: localStorage.getItem('jinsim_pref_counselor') || 'Admin',
      visit_id: visit.id,
      customer_id: customer.id,
      updated_at: new Date().toISOString(),
    } as QuestionnaireData;

    // 고객 ID 기준으로 저장 (모든 방문에서 동일한 데이터 공유)
    localStorage.setItem(`q_customer_${customer.id}`, JSON.stringify(fullData));
    // 기존 visit 기반 저장도 유지 (호환성)
    localStorage.setItem(`q_${visit.id}`, JSON.stringify(fullData));
    onDirtyChange(false);
    onSave();
  };

  useEffect(() => {
    saveTriggerRef.current = handleSave;
  }, [data]);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    const fullData: QuestionnaireData = {
      visit_motives: [],
      concerns_multi: [],
      cosi_top3_goals: [],
      ...data,
      brand_id: BRAND_ID,
      center_id: localStorage.getItem('jinsim_pref_center') || 'SEOUL_MAIN',
      counselor_name: localStorage.getItem('jinsim_pref_counselor') || 'Admin',
      visit_id: visit.id,
      customer_id: customer.id,
      updated_at: new Date().toISOString(),
    } as QuestionnaireData;

    // Save by customer ID (shared across all visits)
    localStorage.setItem(`q_customer_${customer.id}`, JSON.stringify(fullData));
    // Also save by visit ID for compatibility
    localStorage.setItem(`q_${visit.id}`, JSON.stringify(fullData));
  }, [data, visit.id, customer.id]);

  const updateField = (field: keyof QuestionnaireData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    onDirtyChange(true);
  };

  const toggleArrayItem = (field: 'visit_motives' | 'concerns_multi' |
    'ha_style_hearing_loss_level' | 'ha_style_ear_canal_check' | 'ha_style_dexterity' |
    'ha_features_connectivity' | 'ha_features_tinnitus' | 'ha_features_charging' |
    'ha_binaural_bilateral_check' | 'ha_binaural_effect_explanation' |
    'ha_binaural_unilateral_considerations' | 'ha_binaural_side_decision' |
    'ha_budget_subsidy' | 'ha_budget_payment_options' |
    'ha_fitting_adaptation_plan' | 'ha_fitting_checkup_schedule' | 'ha_fitting_warranty_as' |
    'ha_additional_work_environment' | 'ha_additional_comorbidity' |
    'expectation_realistic_understanding' | 'expectation_adaptation_goals' |
    'expectation_initial_experiences' | 'expectation_improvement_areas' |
    'expectation_difficult_situations' | 'expectation_success_practices', item: string) => {
    const current = (data[field] as string[]) || [];
    const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    updateField(field, next);
  };

  const handleCosiGoal = (category: string, note: string) => {
    const current = data.cosi_top3_goals || [];
    const idx = current.findIndex(g => g.category === category);
    let next = [...current];

    if (idx > -1) {
      if (!note && category === '기타') next = next.filter((_, i) => i !== idx);
      else next[idx] = { category, note };
    } else {
      if (next.length < 3) next.push({ category, note });
      else alert("목표는 최대 3개까지만 설정 가능합니다.");
    }
    updateField('cosi_top3_goals', next);
  };

  const renderScale = (field: keyof QuestionnaireData, label: string) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      <span className="text-sm font-semibold text-slate-700 mb-2 md:mb-0 md:max-w-[70%]">{label}</span>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(val => (
          <button 
            key={val} 
            onClick={() => updateField(field, val)} 
            className={`w-10 h-10 rounded-lg border font-bold text-sm transition-all ${data[field] === val ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200'}`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );

  const renderYesNoUnknown = (field: keyof QuestionnaireData, label: string) => (
    <div className="space-y-2">
      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="flex gap-2">
        {['예', '아니오', '모름'].map(opt => (
          <button 
            key={opt}
            onClick={() => updateField(field, opt)}
            className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all ${data[field] === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      <div className="flex justify-between items-end border-b-4 border-blue-600 pb-6">
        <div>
          <h3 className="text-4xl font-black text-blue-900 tracking-tight mb-2">상담 상세 설문지</h3>
          <p className="text-slate-500 font-medium">고객님의 청각 이력과 불편함을 정밀하게 파악합니다.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase">Customer</p>
          <p className="text-xl font-black text-blue-600">{customer.name} <span className="text-slate-400 text-sm">님</span></p>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-8 py-4 flex items-center gap-3"><Info className="w-5 h-5 text-blue-400" /><h4 className="text-white font-bold">A. 방문동기 및 기초 이력</h4></div>
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
                  onClick={() => toggleArrayItem('visit_motives', m)} 
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
                onChange={e => updateField('visit_motives_intro_name', e.target.value)}
              />
            )}
            {data.visit_motives?.includes('기타') && (
              <input 
                className="mt-3 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                placeholder="기타 동기를 입력해주세요"
                value={data.visit_motives_other || ''}
                onChange={e => updateField('visit_motives_other', e.target.value)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
             <div className="space-y-6">
                {renderYesNoUnknown('hearing_test_experience', '2. 청력검사 경험')}
                <input className="w-full p-3 bg-slate-50 border rounded-xl text-xs" placeholder="언제/어디서 받으셨나요?" value={data.hearing_test_exp_note || ''} onChange={e => updateField('hearing_test_exp_note', e.target.value)} />
                
                {renderYesNoUnknown('ent_visit_within_1y', '3. 최근 1년 내 이비인후과 방문')}
                <input className="w-full p-3 bg-slate-50 border rounded-xl text-xs" placeholder="방문 이유/진단 내용" value={data.ent_visit_note || ''} onChange={e => updateField('ent_visit_note', e.target.value)} />
                
                {renderYesNoUnknown('hearing_aid_experience', '4. 보청기 상담/착용 경험')}
                <textarea className="w-full p-3 bg-slate-50 border rounded-xl text-xs h-20" placeholder="착용/상담 시기 및 경험 요약" value={data.hearing_aid_exp_note || ''} onChange={e => updateField('hearing_aid_exp_note', e.target.value)} />
             </div>
             <div className="space-y-6">
                <div>
                   <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">5. 발병 시기 (언제부터 잘 안들리셨나요?)</label>
                   <input className="w-full p-3 bg-slate-50 border rounded-xl text-sm font-bold" value={data.hearing_loss_onset_note || ''} onChange={e => updateField('hearing_loss_onset_note', e.target.value)} placeholder="예: 5년 전부터 서서히" />
                </div>
                {renderYesNoUnknown('ear_disease_treatment_history', '6. 중이염 등 수술/치료 경험')}
                <input className="w-full p-3 bg-slate-50 border rounded-xl text-xs" placeholder="치료/수술 종류" value={data.ear_disease_note || ''} onChange={e => updateField('ear_disease_note', e.target.value)} />
                
                {renderYesNoUnknown('tinnitus', '7. 이명(귀 울림) 증상')}
                <input className="w-full p-3 bg-slate-50 border rounded-xl text-xs" placeholder="어떤 소리/언제 주로 들리나요?" value={data.tinnitus_note || ''} onChange={e => updateField('tinnitus_note', e.target.value)} />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
             <div>
                <label className="block text-xs font-black text-slate-400 mb-2">8. 더 잘 들리는 귀</label>
                <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={data.better_ear || ''} onChange={e => updateField('better_ear', e.target.value)}>
                   <option value="">선택</option><option value="오른쪽">오른쪽</option><option value="왼쪽">왼쪽</option><option value="비슷함">비슷함</option><option value="모름">모름</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-black text-slate-400 mb-2">9. 보청기 희망 위치</label>
                <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={data.desired_aid_ear || ''} onChange={e => updateField('desired_aid_ear', e.target.value)}>
                   <option value="">선택</option><option value="오른쪽">오른쪽</option><option value="왼쪽">왼쪽</option><option value="양쪽">양쪽</option><option value="모름">모름</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-black text-slate-400 mb-2">10. 전화 받는 쪽</label>
                <select className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={data.phone_ear || ''} onChange={e => updateField('phone_ear', e.target.value)}>
                   <option value="">선택</option><option value="오른쪽">오른쪽</option><option value="왼쪽">왼쪽</option><option value="양쪽 번갈아">양쪽 번갈아</option><option value="스피커폰/이어폰">스피커폰/이어폰</option>
                </select>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {renderYesNoUnknown('dexterity_issue', '11. 손 움직임 불편함(섬세한 조작)')}
             <div>
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase">12. 직업 및 취미</label>
                <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold" value={data.occupation_hobby || ''} onChange={e => updateField('occupation_hobby', e.target.value)} placeholder="자유 기입" />
             </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-blue-600 px-8 py-4 flex items-center gap-3"><Activity className="w-5 h-5 text-white" /><h4 className="text-white font-bold">B & C. 청취 어려움 및 정서 영향 프로필 (0~3점)</h4></div>
        <div className="p-8">
           <p className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest px-4 border-l-4 border-blue-500">0:전혀없음 / 1:가끔 / 2:자주 / 3:항상</p>
           <div className="space-y-2">
             <div className="pb-4 border-b border-slate-100 mb-4"><p className="text-xs font-black text-blue-600 mb-2 uppercase tracking-widest">B. 청취 어려움 (APHAB)</p></div>
             {renderScale('diff_quiet_1to1', '13. 조용한 곳에서 1:1 대화가 또렷하지 않아 되묻는다.')}
             {renderScale('diff_small_group', '14. 3~4명 정도의 작은 모임에서 대화를 따라가기 어렵다.')}
             {renderScale('diff_background_noise', '15. 식당/카페처럼 시끄러운 곳에서 대화가 특히 어렵다.')}
             {renderScale('diff_party_multi_talkers', '16. 여러 사람이 동시에 말하는 상황에서 말소리가 섞인다.')}
             {renderScale('diff_reverberation_distance', '17. 예배당/강당처럼 울림이 있거나 거리가 멀면 어렵다.')}
             {renderScale('diff_tv_volume', '18. TV/라디오 볼륨을 남들보다 크게 해야 편하다.')}
             {renderScale('diff_phone_speech', '19. 전화 통화에서 상대방 말을 놓치는 경우가 있다.')}
             
             <div className="py-4 border-b border-slate-100 my-4"><p className="text-xs font-black text-orange-600 mb-2 uppercase tracking-widest">C. 소리의 불편함 및 사회·정서 영향 (HHIE)</p></div>
             {renderScale('aversive_loud_sounds', '20. 접시 부딪힘/알람 등 큰 소리가 너무 고통스럽거나 불쾌하다.')}
             {renderScale('social_withdrawal', '21. 청력 문제 때문에 모임 참여가 줄거나 피하게 된다.')}
             {renderScale('emotional_impact', '22. 청력 문제로 답답함/스트레스/짜증 등을 느낀 적이 있다.')}
           </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-600 px-8 py-4 flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-white" /><h4 className="text-white font-bold">D. 보청기 기대 및 우려</h4></div>
        <div className="p-8 space-y-8">
           <div>
              <p className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">23. 보청기 착용 후 기대 수준</p>
              <div className="grid grid-cols-1 gap-2">
                 {[
                   { k: 'A', t: '시끄러운 곳에서도 “대부분 완벽하게” 잘 들리길 기대한다' },
                   { k: 'B', t: '전반적으로 “많이” 좋아지길 기대한다(되묻는 횟수 감소)' },
                   { k: 'C', t: '“일부 상황만” 개선돼도 만족할 것 같다(TV/가족대화)' },
                   { k: 'D', t: '기대 수준을 잘 모르겠다' },
                   { k: 'E', t: '기타 (직접 입력)' }
                 ].map(opt => (
                   <button 
                    key={opt.k}
                    onClick={() => updateField('expectation_level', opt.k)}
                    className={`p-4 text-left border rounded-2xl transition-all flex items-center gap-4 ${data.expectation_level === opt.k ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-600 border-slate-100 hover:border-emerald-300'}`}
                   >
                     <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${data.expectation_level === opt.k ? 'bg-white text-emerald-600' : 'bg-slate-100'}`}>{opt.k}</span>
                     <span className="text-sm font-bold">{opt.t}</span>
                   </button>
                 ))}
              </div>
              {data.expectation_level === 'E' && (
                <input className="mt-3 w-full p-3 bg-slate-50 border rounded-xl outline-none" placeholder="기타 기대사항 입력" value={data.expectation_other || ''} onChange={e => updateField('expectation_other', e.target.value)} />
              )}
           </div>
           <div>
              <p className="text-xs font-black text-slate-400 mb-4 uppercase tracking-widest">24. 보청기 착용/구매 시 걱정되는 점 (중복)</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {CONCERNS.map(c => (
                  <button key={c} onClick={() => toggleArrayItem('concerns_multi', c)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.concerns_multi?.includes(c) ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-500 hover:border-emerald-300'}`}>{c}</button>
                ))}
              </div>
           </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-orange-600 px-8 py-4 flex items-center gap-3"><Target className="w-5 h-5 text-white" /><h4 className="text-white font-bold">E. 개인 목표 설정 (COSI) - 개선 희망 상황 TOP 3</h4></div>
        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1, 2, 3].map(num => {
               const currentGoal = data.cosi_top3_goals?.[num - 1];
               return (
                 <div key={num} className="p-6 bg-orange-50/50 border-2 border-orange-100 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">{num}</span>
                       <span className="text-xs font-black text-orange-900 uppercase">Priority Goal</span>
                    </div>
                    <select 
                      className="w-full p-3 bg-white border border-orange-200 rounded-xl text-xs font-bold outline-none"
                      value={currentGoal?.category || ''}
                      onChange={e => handleCosiGoal(e.target.value, currentGoal?.note || '')}
                    >
                      <option value="">카테고리 선택</option>
                      {COSI_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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

      {/* 기초 설문 / 심층 설문 구분선 */}
      <div className="relative my-12">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-red-500"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-6 py-2 text-sm font-bold text-red-600">
            여기까지는 기초 설문 상담입니다. 아래는 심층 설문상담 내용에 해당합니다.
          </span>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-purple-600 px-8 py-4 flex items-center gap-3"><Zap className="w-5 h-5 text-white" /><h4 className="text-white font-bold">F. 보청기 스타일/기능/양이 계획 수립</h4></div>
        <div className="p-8 space-y-8">

          {/* 1. 보청기 스타일 선택 기준 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">1. 보청기 스타일 선택 기준</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">청력 손실 정도</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '경도(25~40 dB): CIC, ITC 가능',
                    '중등도(40~55 dB): ITE, RIC 권장',
                    '고도(55~70 dB): BTE, 파워 RIC',
                    '심도(70 dB 이상): 슈퍼파워 BTE'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_style_hearing_loss_level', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_style_hearing_loss_level?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">외이도 상태 확인</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '외이도 좁음/굴곡 심함 → CIC 어려움',
                    '만성 중이염/습진 → 귓속형(ITE/CIC) 부적합',
                    '귀지 과다 분비 → 귓속형 관리 어려움',
                    '정상 외이도 → 모든 타입 가능'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_style_ear_canal_check', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_style_ear_canal_check?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">손 떨림/손가락 민첩성</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '손 떨림 심함 → BTE/RIC 권장 (배터리 교체 쉬움)',
                    '관절염/손가락 굵음 → 귓속형 조작 어려움',
                    '미세조작 가능 → 모든 타입 가능'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_style_dexterity', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_style_dexterity?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">미용적 선호도</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { k: 'INVISIBLE', t: '눈에 안 띄는 것 최우선 (CIC/IIC)' },
                    { k: 'MODERATE', t: '적당히 작으면 OK (RIC/ITE)' },
                    { k: 'NO_CONCERN', t: '크기 상관없음 (BTE)' }
                  ].map(opt => (
                    <button key={opt.k} onClick={() => updateField('ha_style_cosmetic_preference', opt.k)} className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${data.ha_style_cosmetic_preference === opt.k ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt.t}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 필수 기능 체크 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">2. 필수 기능 체크</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">연결성</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '블루투스 필수 (스마트폰 통화/음악)',
                    'TV 스트리밍 원함',
                    '앱 조절 기능 필요',
                    '연결 기능 불필요'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_features_connectivity', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_features_connectivity?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">이명 관리</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '이명 마스킹 기능 필요',
                    '이명 없음 / 불필요'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_features_tinnitus', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_features_tinnitus?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">충전 방식</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '충전식 선호 (리튬이온)',
                    '배터리 교체식 선호 (아연공기 전지)'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_features_charging', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_features_charging?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 양이 착용 계획 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">3. 양이 착용 계획</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">양측 난청 확인</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '좌우 모두 청력 손실 확인',
                    '한쪽만 난청 (단측 난청)'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_binaural_bilateral_check', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_bilateral_check?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">양이 효과 설명</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '소리의 방향 파악 개선',
                    '시끄러운 환경에서 청취력 향상',
                    '청력 균형 유지 (한쪽 귀 퇴화 방지)',
                    '음질 더 자연스럽고 풍부함'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_binaural_effect_explanation', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_effect_explanation?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">단측 착용 시 고려사항</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '예산 부족으로 일단 한쪽만',
                    '적응 후 추가 구매 계획',
                    '한쪽 귀만 난청 (의학적 이유)',
                    '양쪽 동시 착용 거부감'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_binaural_unilateral_considerations', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_unilateral_considerations?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">착용 측 결정 (단측 착용 시)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '청력 나쁜 쪽 우선',
                    '어음명료도 좋은 쪽 우선',
                    '전화 받는 쪽 / 생활 편의성'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_binaural_side_decision', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_side_decision?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. 예산 및 보조금 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">4. 예산 및 보조금</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">가격대 확인 (편측 기준)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { k: 'BUDGET', t: '경제형 (100~200만원)' },
                    { k: 'MID', t: '중급형 (200~400만원)' },
                    { k: 'PREMIUM', t: '고급형 (400~600만원)' },
                    { k: 'LUXURY', t: '최고급 (600만원 이상)' }
                  ].map(opt => (
                    <button key={opt.k} onClick={() => updateField('ha_budget_price_range', opt.k)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_budget_price_range === opt.k ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt.t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">보조금 지원 대상 확인</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '청각장애 등록 (최대 131만원)',
                    '국가유공자 (전액 또는 일부)',
                    '의료급여 수급자 (추가 혜택)',
                    '해당 없음 / 전액 본인 부담'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_budget_subsidy', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_budget_subsidy?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">후불제/할부 옵션</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    '무이자 할부 필요',
                    '일시불 가능'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_budget_payment_options', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_budget_payment_options?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. 피팅 및 사후관리 계획 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">5. 피팅 및 사후관리 계획</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">초기 적응 계획</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '1주차: 조용한 환경에서 2~3시간씩',
                    '2주차: 실내외 혼합 환경, 5~6시간',
                    '3주차: 하루 종일 착용 목표'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_fitting_adaptation_plan', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_fitting_adaptation_plan?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">정기 점검 일정</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '1주 후 재방문 (미세조정)',
                    '1개월 후 점검',
                    '3개월 후 만족도 평가'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_fitting_checkup_schedule', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_fitting_checkup_schedule?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">보증 및 A/S 확인</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '제조사 보증 기간 (통상 2년)',
                    '수리/분실 보험 가입 여부',
                    '센터 무료 점검/청소 정책'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_fitting_warranty_as', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_fitting_warranty_as?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. 추가 고려사항 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">6. 추가 고려사항</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">직업/생활 환경</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '야외 작업/시끄러운 공장 → 방진/방수 필수',
                    '사무직/강의 → 지향성 마이크 중요',
                    '은퇴/집에서 주로 생활 → 기본형도 충분'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_additional_work_environment', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_additional_work_environment?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">동반 질환</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '치매/인지 저하 → 단순 조작 모델',
                    '시력 저하 → 음성 안내 기능',
                    '특이사항 없음'
                  ].map(opt => (
                    <button key={opt} onClick={() => toggleArrayItem('ha_additional_comorbidity', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_additional_comorbidity?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-teal-600 px-8 py-4 flex items-center gap-3"><HeartPulse className="w-5 h-5 text-white" /><h4 className="text-white font-bold">G. 현실적 기대치/적응기간 안내</h4></div>
        <div className="p-8 space-y-8">

          {/* 1. 보청기 효과에 대한 현실적 기대 */}
          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">1. 보청기 효과에 대한 현실적 기대</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '정상 청력 복원은 아님 - 안경처럼 완벽한 교정이 아닌 보조 기구임을 이해',
                '모든 소리가 다 들리는 것은 아님 - 특히 시끄러운 환경에서는 한계가 있음',
                '배경소음 완전 차단 불가 - 소음 억제 기능은 있으나 100% 제거는 불가능',
                '즉각적인 효과보다 점진적 개선 - 착용 후 바로가 아닌 적응 과정 필요'
              ].map(opt => (
                <button key={opt} onClick={() => toggleArrayItem('expectation_realistic_understanding', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_realistic_understanding?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          {/* 2. 적응 기간 단계별 목표 */}
          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">2. 적응 기간 단계별 목표</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '1주차: 조용한 환경에서 2-3시간씩 착용, 자신의 목소리 적응',
                '2주차: 실내외 혼합 환경, 5-6시간 착용, 다양한 소리에 적응',
                '3-4주차: 하루 종일 착용 목표, 대부분의 일상 환경 적응',
                '2-3개월: 완전 적응, 만족도 재평가 시점'
              ].map(opt => (
                <button key={opt} onClick={() => toggleArrayItem('expectation_adaptation_goals', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_adaptation_goals?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          {/* 3. 초기 적응 시 흔한 경험 */}
          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">3. 초기 적응 시 흔한 경험</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '자신의 목소리가 이상하게 들림 (폐쇄 효과) - 정상이며 적응 가능',
                '배경소리가 크게 들림 (냉장고, 에어컨 등) - 뇌가 적응하면서 자연스러워짐',
                '피로감/두통 - 초기 1-2주간 흔함, 착용 시간 점진적 증가로 해결',
                '귀 불편감/귓바퀴 아픔 - 피팅 조정으로 해결 가능'
              ].map(opt => (
                <button key={opt} onClick={() => toggleArrayItem('expectation_initial_experiences', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_initial_experiences?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          {/* 4. 기대 가능한 개선 영역 */}
          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">4. 기대 가능한 개선 영역</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '1:1 대화 상황 - 가장 큰 개선 효과',
                'TV 시청 - 볼륨 낮춰도 편안하게 시청',
                '전화 통화 - 블루투스 기능 활용 시 더욱 명확',
                '소규모 모임 - 3-4명 대화도 참여 가능'
              ].map(opt => (
                <button key={opt} onClick={() => toggleArrayItem('expectation_improvement_areas', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_improvement_areas?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          {/* 5. 여전히 어려울 수 있는 상황 */}
          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">5. 여전히 어려울 수 있는 상황</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '시끄러운 식당/카페 - 개선되나 완벽하지 않음',
                '여러 사람이 동시에 말하는 경우 - 집중력 여전히 필요',
                '큰 강당/넓은 공간 - 거리와 울림으로 인한 한계',
                '마스크 착용자 대화 - 입 모양 안 보여 여전히 어려움'
              ].map(opt => (
                <button key={opt} onClick={() => toggleArrayItem('expectation_difficult_situations', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_difficult_situations?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          {/* 6. 성공적 적응을 위한 실천 사항 */}
          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">6. 성공적 적응을 위한 실천 사항</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '매일 꾸준히 착용 - 하루 건너뛰면 적응 기간 연장',
                '불편사항 즉시 기록 - 재방문 시 정확한 조정 가능',
                '가족/지인에게 미리 알림 - 천천히 크게 말해달라고 요청',
                '적응 일지 작성 - 주간 단위로 변화 체크'
              ].map(opt => (
                <button key={opt} onClick={() => toggleArrayItem('expectation_success_practices', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_success_practices?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

        </div>
      </section>

      <div className="sticky bottom-8 flex justify-center z-50">
        <button 
          onClick={handleSave}
          className="bg-slate-900 text-white px-20 py-6 rounded-3xl font-black text-2xl flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        >
          <Save className="w-8 h-8 group-hover:rotate-12 transition-transform" />
          상담 결과 전체 저장
        </button>
      </div>
    </div>
  );
};

export default QuestionnaireForm;
