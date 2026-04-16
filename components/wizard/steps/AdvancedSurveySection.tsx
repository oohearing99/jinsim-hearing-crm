'use client';
import { Zap, HeartPulse } from 'lucide-react';
import type { QuestionnaireData } from '../../../types';
import { toggleArrayPatch } from './inputs';

interface Props {
  data: Partial<QuestionnaireData>;
  onChange: (patch: Partial<QuestionnaireData>) => void;
}

export function AdvancedSurveySection({ data, onChange }: Props) {
  const toggle = (field: Parameters<typeof toggleArrayPatch>[1], item: string) =>
    onChange(toggleArrayPatch(data, field, item));

  return (
    <>
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
        <div className="bg-purple-600 px-8 py-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-white" />
          <h4 className="text-white font-bold">F. 보청기 스타일/기능/양이 계획 수립</h4>
        </div>
        <div className="p-8 space-y-8">
          {/* 1. 보청기 스타일 선택 기준 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
              1. 보청기 스타일 선택 기준
            </p>
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
                    <button key={opt} type="button" onClick={() => toggle('ha_style_hearing_loss_level', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_style_hearing_loss_level?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
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
                    <button key={opt} type="button" onClick={() => toggle('ha_style_ear_canal_check', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_style_ear_canal_check?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
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
                    <button key={opt} type="button" onClick={() => toggle('ha_style_dexterity', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_style_dexterity?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
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
                    <button key={opt.k} type="button" onClick={() => onChange({ ha_style_cosmetic_preference: opt.k })} className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${data.ha_style_cosmetic_preference === opt.k ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt.t}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 필수 기능 체크 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
              2. 필수 기능 체크
            </p>
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
                    <button key={opt} type="button" onClick={() => toggle('ha_features_connectivity', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_features_connectivity?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">이명 관리</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['이명 마스킹 기능 필요', '이명 없음 / 불필요'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_features_tinnitus', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_features_tinnitus?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">충전 방식</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['충전식 선호 (리튬이온)', '배터리 교체식 선호 (아연공기 전지)'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_features_charging', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_features_charging?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 양이 착용 계획 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
              3. 양이 착용 계획
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">양측 난청 확인</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['좌우 모두 청력 손실 확인', '한쪽만 난청 (단측 난청)'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_binaural_bilateral_check', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_bilateral_check?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
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
                    <button key={opt} type="button" onClick={() => toggle('ha_binaural_effect_explanation', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_effect_explanation?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
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
                    <button key={opt} type="button" onClick={() => toggle('ha_binaural_unilateral_considerations', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_unilateral_considerations?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">착용 측 결정 (단측 착용 시)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {['청력 나쁜 쪽 우선', '어음명료도 좋은 쪽 우선', '전화 받는 쪽 / 생활 편의성'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_binaural_side_decision', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_binaural_side_decision?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4. 예산 및 보조금 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
              4. 예산 및 보조금
            </p>
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
                    <button key={opt.k} type="button" onClick={() => onChange({ ha_budget_price_range: opt.k })} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_budget_price_range === opt.k ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt.t}</button>
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
                    <button key={opt} type="button" onClick={() => toggle('ha_budget_subsidy', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_budget_subsidy?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">후불제/할부 옵션</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['무이자 할부 필요', '일시불 가능'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_budget_payment_options', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_budget_payment_options?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. 피팅 및 사후관리 계획 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
              5. 피팅 및 사후관리 계획
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">초기 적응 계획</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '1주차: 조용한 환경에서 2~3시간씩',
                    '2주차: 실내외 혼합 환경, 5~6시간',
                    '3주차: 하루 종일 착용 목표'
                  ].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_fitting_adaptation_plan', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_fitting_adaptation_plan?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">정기 점검 일정</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {['1주 후 재방문 (미세조정)', '1개월 후 점검', '3개월 후 만족도 평가'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_fitting_checkup_schedule', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_fitting_checkup_schedule?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">보증 및 A/S 확인</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {['제조사 보증 기간 (통상 2년)', '수리/분실 보험 가입 여부', '센터 무료 점검/청소 정책'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_fitting_warranty_as', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_fitting_warranty_as?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 6. 추가 고려사항 */}
          <div>
            <p className="text-xs font-black text-purple-600 mb-4 uppercase tracking-widest border-b border-purple-100 pb-2">
              6. 추가 고려사항
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">직업/생활 환경</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    '야외 작업/시끄러운 공장 → 방진/방수 필수',
                    '사무직/강의 → 지향성 마이크 중요',
                    '은퇴/집에서 주로 생활 → 기본형도 충분'
                  ].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_additional_work_environment', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_additional_work_environment?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 mb-3 uppercase tracking-widest">동반 질환</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {['치매/인지 저하 → 단순 조작 모델', '시력 저하 → 음성 안내 기능', '특이사항 없음'].map(opt => (
                    <button key={opt} type="button" onClick={() => toggle('ha_additional_comorbidity', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.ha_additional_comorbidity?.includes(opt) ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-white text-slate-600 hover:border-purple-300'}`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-teal-600 px-8 py-4 flex items-center gap-3">
          <HeartPulse className="w-5 h-5 text-white" />
          <h4 className="text-white font-bold">G. 현실적 기대치/적응기간 안내</h4>
        </div>
        <div className="p-8 space-y-8">
          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">1. 보청기 효과에 대한 현실적 기대</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '정상 청력 복원은 아님 - 안경처럼 완벽한 교정이 아닌 보조 기구임을 이해',
                '모든 소리가 다 들리는 것은 아님 - 특히 시끄러운 환경에서는 한계가 있음',
                '배경소음 완전 차단 불가 - 소음 억제 기능은 있으나 100% 제거는 불가능',
                '즉각적인 효과보다 점진적 개선 - 착용 후 바로가 아닌 적응 과정 필요'
              ].map(opt => (
                <button key={opt} type="button" onClick={() => toggle('expectation_realistic_understanding', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_realistic_understanding?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">2. 적응 기간 단계별 목표</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '1주차: 조용한 환경에서 2-3시간씩 착용, 자신의 목소리 적응',
                '2주차: 실내외 혼합 환경, 5-6시간 착용, 다양한 소리에 적응',
                '3-4주차: 하루 종일 착용 목표, 대부분의 일상 환경 적응',
                '2-3개월: 완전 적응, 만족도 재평가 시점'
              ].map(opt => (
                <button key={opt} type="button" onClick={() => toggle('expectation_adaptation_goals', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_adaptation_goals?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">3. 초기 적응 시 흔한 경험</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '자신의 목소리가 이상하게 들림 (폐쇄 효과) - 정상이며 적응 가능',
                '배경소리가 크게 들림 (냉장고, 에어컨 등) - 뇌가 적응하면서 자연스러워짐',
                '피로감/두통 - 초기 1-2주간 흔함, 착용 시간 점진적 증가로 해결',
                '귀 불편감/귓바퀴 아픔 - 피팅 조정으로 해결 가능'
              ].map(opt => (
                <button key={opt} type="button" onClick={() => toggle('expectation_initial_experiences', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_initial_experiences?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">4. 기대 가능한 개선 영역</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '1:1 대화 상황 - 가장 큰 개선 효과',
                'TV 시청 - 볼륨 낮춰도 편안하게 시청',
                '전화 통화 - 블루투스 기능 활용 시 더욱 명확',
                '소규모 모임 - 3-4명 대화도 참여 가능'
              ].map(opt => (
                <button key={opt} type="button" onClick={() => toggle('expectation_improvement_areas', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_improvement_areas?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">5. 여전히 어려울 수 있는 상황</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '시끄러운 식당/카페 - 개선되나 완벽하지 않음',
                '여러 사람이 동시에 말하는 경우 - 집중력 여전히 필요',
                '큰 강당/넓은 공간 - 거리와 울림으로 인한 한계',
                '마스크 착용자 대화 - 입 모양 안 보여 여전히 어려움'
              ].map(opt => (
                <button key={opt} type="button" onClick={() => toggle('expectation_difficult_situations', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_difficult_situations?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black text-teal-600 mb-4 uppercase tracking-widest">6. 성공적 적응을 위한 실천 사항</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                '매일 꾸준히 착용 - 하루 건너뛰면 적응 기간 연장',
                '불편사항 즉시 기록 - 재방문 시 정확한 조정 가능',
                '가족/지인에게 미리 알림 - 천천히 크게 말해달라고 요청',
                '적응 일지 작성 - 주간 단위로 변화 체크'
              ].map(opt => (
                <button key={opt} type="button" onClick={() => toggle('expectation_success_practices', opt)} className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${data.expectation_success_practices?.includes(opt) ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-slate-600 hover:border-teal-300'}`}>{opt}</button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
