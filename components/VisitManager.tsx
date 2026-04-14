
import React, { useState, useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { Visit, Customer, QuestionnaireData } from '../types';
import { QuestionnaireWizard } from './wizard/QuestionnaireWizard';
import { BRAND_ID } from '../constants';
import SpeechTestForm from './SpeechTestForm';
import PureToneAudiogram from './PureToneAudiogram';
import HaProtocolTab from './HaProtocolTab';
import { FileText, Headphones, Activity, CheckCircle2 } from 'lucide-react';
import StepIndicator from './StepIndicator';
import VisitSummaryBar from './VisitSummaryBar';
import { getAllTabStatuses, getCurrentStep, getOverallProgress, CompletionStatus } from '../utils/completionUtils';

interface Props {
  visit: Visit;
  customer: Customer;
  onSaveSuccess: (msg: string) => void;
  onDirtyChange: (isDirty: boolean) => void;
  saveTriggerRef: React.MutableRefObject<() => void>;
}

export interface VisitManagerHandle {
  captureImages: () => Promise<void>;
}

const VisitManager = forwardRef<VisitManagerHandle, Props>(({ visit, customer, onSaveSuccess, onDirtyChange, saveTriggerRef }, ref) => {
  const isHA = visit.visit_type === 'HA_PROTOCOL';
  const [activeTab, setActiveTab] = useState<'Q' | 'SPEECH' | 'PTA' | 'HA'>(isHA ? 'HA' : 'Q');

  const tabs = [
    ...(isHA ? [{ id: 'HA', name: '보청기 프로토콜', icon: CheckCircle2, color: 'text-orange-600' }] : []),
    { id: 'Q', name: '상담 설문지', icon: FileText, color: 'text-blue-600' },
    { id: 'PTA', name: '순음검사', icon: Activity, color: 'text-orange-600' },
    { id: 'SPEECH', name: '어음검사', icon: Headphones, color: 'text-purple-600' },
  ] as const;

  // 탭별 완료 상태
  const [tabStatuses, setTabStatuses] = useState<Record<string, CompletionStatus>>({});

  // 스텝 정의
  const stepDefs = isHA
    ? [
        { id: 'Q', label: '접수/설문' },
        { id: 'PTA', label: '순음검사' },
        { id: 'SPEECH', label: '어음검사' },
        { id: 'HA', label: '프로토콜' },
      ]
    : [
        { id: 'Q', label: '접수/설문' },
        { id: 'PTA', label: '순음검사' },
        { id: 'SPEECH', label: '어음검사' },
      ];

  // 탭 순서 (이전/다음 네비게이션용)
  const stepOrder = isHA ? ['Q', 'PTA', 'SPEECH', 'HA'] as const : ['Q', 'PTA', 'SPEECH'] as const;

  // 완료 상태 갱신
  useEffect(() => {
    const statuses = getAllTabStatuses(customer.id, visit.id, isHA);
    setTabStatuses(statuses);
  }, [customer.id, visit.id, isHA, activeTab]);

  const currentStepIndex = getCurrentStep(tabStatuses, isHA);
  const progress = getOverallProgress(tabStatuses, isHA);

  // 스텝 클릭 → 해당 탭으로 이동
  const handleStepClick = (stepIndex: number) => {
    const stepId = stepDefs[stepIndex].id;
    setActiveTab(stepId as any);
  };

  // 이전/다음 네비게이션
  const currentTabIndex = stepOrder.indexOf(activeTab as any);
  const prevTab = currentTabIndex > 0 ? stepOrder[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < stepOrder.length - 1 ? stepOrder[currentTabIndex + 1] : null;
  const getTabLabel = (id: string) => stepDefs.find(s => s.id === id)?.label || id;

  // 이미지 캡쳐 핸들러 (직접 JPG 캡쳐 방식 - 안정적)
  const handleCaptureImages = async () => {
    const originalTab = activeTab;
    let totalSuccess = 0;
    const capturedBlobs: Array<{ name: string; blob: Blob }> = [];

    try {
      const { captureElementAsBlob } = await import('../utils/captureUtils');
      const JSZip = (await import('jszip')).default;

      // 탭별로 캡쳐할 섹션 정의
      const tabSections: Array<{ tab: 'Q' | 'SPEECH' | 'PTA' | 'HA', sections: Array<{ name: string, selector: string }> }> = [
        {
          tab: 'HA',
          sections: [
            { name: '방문요약', selector: '[data-capture="visit-summary"]' },
            { name: '순음검사-청력도', selector: '[data-capture="pure-tone-audiogram"]' },
            { name: '어음검사-일치도검증', selector: '[data-capture="speech-validation"]' },
            { name: '어음검사-우측', selector: '[data-capture="speech-right"]' },
            { name: '어음검사-좌측', selector: '[data-capture="speech-left"]' },
            { name: '어음검사-음장', selector: '[data-capture="speech-freefield"]' },
          ]
        },
        {
          tab: 'PTA',
          sections: [
            { name: '순음검사-청력도', selector: '[data-capture="pure-tone-audiogram"]' },
            { name: '순음검사-PTA6분석', selector: '[data-capture="pure-tone-pta6"]' },
            { name: '순음검사-데이터테이블', selector: '[data-capture="pure-tone-table"]' },
          ]
        },
        {
          tab: 'SPEECH',
          sections: [
            { name: '어음검사-우측', selector: '[data-capture="speech-right"]' },
            { name: '어음검사-좌측', selector: '[data-capture="speech-left"]' },
            { name: '어음검사-음장', selector: '[data-capture="speech-freefield"]' },
          ]
        },
      ];

      // 고객정보 캡쳐
      const customerInfoElement = document.querySelector('[data-capture="customer-info"]') as HTMLElement;
      if (customerInfoElement) {
        console.log('[Capture] 고객정보 캡쳐 중...');
        const blob = await captureElementAsBlob(customerInfoElement);
        if (blob) {
          capturedBlobs.push({ name: '01-고객정보.jpg', blob });
          totalSuccess++;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 각 탭으로 이동하면서 캡쳐
      for (const tabSection of tabSections) {
        if (tabSection.tab === 'HA' && !isHA) continue;

        console.log(`[Capture] 탭 전환: ${tabSection.tab}`);
        setActiveTab(tabSection.tab as any);
        await new Promise(resolve => setTimeout(resolve, 2000));

        for (const section of tabSection.sections) {
          const element = document.querySelector(section.selector) as HTMLElement;
          if (element) {
            const hasChart = element.querySelector('.recharts-wrapper, .recharts-responsive-container');
            if (hasChart) {
              console.log('[Capture] 차트 렌더링 대기 중...');
              await new Promise(resolve => setTimeout(resolve, 1500));
            }

            console.log(`[Capture] 캡쳐 시작: ${section.name}`);
            const blob = await captureElementAsBlob(element);
            if (blob) {
              const index = String(capturedBlobs.length + 1).padStart(2, '0');
              capturedBlobs.push({ name: `${index}-${section.name}.jpg`, blob });
              totalSuccess++;
              console.log(`[Capture] ✓ 성공: ${section.name}`);
            }
          } else {
            console.warn(`[Capture] 요소 없음: ${section.name}`);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setActiveTab(originalTab);

      // ZIP 파일 생성
      if (capturedBlobs.length > 0) {
        const zip = new JSZip();
        const dateStr = visit.visit_date.replace(/[-:]/g, '').substring(0, 8);
        const visitTypeEng = visit.visit_type === 'HA_PROTOCOL' ? 'HA' : 'GENERAL';
        const folderName = `${customer.name}_${visitTypeEng}_${dateStr}`;
        const folder = zip.folder(folderName);

        if (folder) {
          capturedBlobs.forEach(({ name, blob }) => {
            folder.file(name, blob);
          });

          const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
          });

          const url = URL.createObjectURL(zipBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${folderName}.zip`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 200);
        }

        onSaveSuccess(`${totalSuccess}개의 이미지가 ZIP 파일로 저장되었습니다.`);
      } else {
        onSaveSuccess('이미지 캡쳐에 실패했습니다.');
      }
    } catch (error) {
      console.error('[Capture] 오류 발생:', error);
      onSaveSuccess('이미지 캡쳐 중 오류가 발생했습니다.');
      setActiveTab(originalTab);
    }
  };

  // ref를 통해 외부에서 캡쳐 함수 호출 가능하도록
  useImperativeHandle(ref, () => ({
    captureImages: handleCaptureImages
  }));

  return (
    <div className="space-y-0">
      {/* 방문 요약 바 */}
      <VisitSummaryBar visit={visit} customer={customer} progress={progress} />

      {/* 스텝 인디케이터 */}
      <StepIndicator
        steps={stepDefs}
        statuses={tabStatuses}
        currentStepIndex={currentStepIndex}
        onStepClick={handleStepClick}
      />

      {/* 탭 바 */}
      <div className="px-4 pt-4">
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/50 rounded-2xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black transition-all duration-200 ${
                  isActive ? `bg-white shadow-xl ${tab.color} scale-[1.02]` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />{tab.name}
                {/* 완료 배지 */}
                {tabStatuses[tab.id] === 'completed' && (
                  <span className="w-[18px] h-[18px] rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-black">✓</span>
                )}
                {tabStatuses[tab.id] === 'in_progress' && (
                  <span className="w-[18px] h-[18px] rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">·</span>
                )}
                {tabStatuses[tab.id] === 'not_started' && (
                  <span className="w-[18px] h-[18px] rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black">—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[700px] overflow-hidden mx-4">
        <div className="p-8">
          {activeTab === 'HA' && isHA && <HaProtocolTab visit={visit} customer={customer} onSave={() => onSaveSuccess('프로토콜 데이터가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} onNavigateToTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'Q' && <QuestionnaireTabPanel visit={visit} customer={customer} onSaveSuccess={onSaveSuccess} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
          {activeTab === 'SPEECH' && <SpeechTestForm visit={visit} customer={customer} onSave={() => onSaveSuccess('어음검사 결과가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
          {activeTab === 'PTA' && <PureToneAudiogram visit={visit} customer={customer} onSave={() => onSaveSuccess('순음청력검사 결과가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="border-t border-slate-200 px-6 py-4 flex justify-between items-center bg-white rounded-b-3xl mx-4">
        {prevTab ? (
          <button
            onClick={() => setActiveTab(prevTab as any)}
            className="px-5 py-2.5 border-2 border-slate-100 rounded-xl text-sm font-black hover:bg-slate-50 transition-all text-slate-600"
          >
            ← 이전: {getTabLabel(prevTab)}
          </button>
        ) : (
          <div />
        )}
        {nextTab ? (
          <button
            onClick={() => setActiveTab(nextTab as any)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            다음: {getTabLabel(nextTab)} →
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
});

VisitManager.displayName = 'VisitManager';

function QuestionnaireTabPanel({ visit, customer, onSaveSuccess, onDirtyChange, saveTriggerRef }: {
  visit: Visit;
  customer: Customer;
  onSaveSuccess: (msg: string) => void;
  onDirtyChange: (d: boolean) => void;
  saveTriggerRef: React.MutableRefObject<() => void>;
}) {
  const [initialData] = useState<Partial<QuestionnaireData>>(() => {
    try {
      const savedByCustomer = localStorage.getItem(`q_customer_${customer.id}`);
      const savedByVisit = localStorage.getItem(`q_${visit.id}`);
      const saved = savedByCustomer || savedByVisit;
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('[QuestionnaireTabPanel] load failed', e);
    }
    return {
      visit_id: visit.id,
      customer_id: customer.id,
      visit_motives: [],
      concerns_multi: [],
      cosi_top3_goals: [],
      created_at: new Date().toISOString(),
    };
  });
  const liveDataRef = useRef<Partial<QuestionnaireData>>(initialData);

  const persist = (d: Partial<QuestionnaireData>) => {
    const full = {
      ...d,
      brand_id: BRAND_ID,
      center_id: localStorage.getItem('jinsim_pref_center') || 'SEOUL_MAIN',
      counselor_name: localStorage.getItem('jinsim_pref_counselor') || 'Admin',
      visit_id: visit.id,
      customer_id: customer.id,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(`q_customer_${customer.id}`, JSON.stringify(full));
    localStorage.setItem(`q_${visit.id}`, JSON.stringify(full));
  };

  useEffect(() => {
    saveTriggerRef.current = () => {
      persist(liveDataRef.current);
      onDirtyChange(false);
      onSaveSuccess('상담 설문지가 저장되었습니다.');
    };
  }, [saveTriggerRef, onDirtyChange, onSaveSuccess, visit.id, customer.id]);

  return (
    <QuestionnaireWizard
      initialData={initialData}
      onDataChange={(d) => {
        liveDataRef.current = d;
        onDirtyChange(true);
        persist(d);
      }}
      onSave={(d) => {
        persist(d);
        onDirtyChange(false);
        onSaveSuccess('상담 설문지가 저장되었습니다.');
      }}
    />
  );
}

export default VisitManager;
