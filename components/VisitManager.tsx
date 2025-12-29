
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Visit, Customer } from '../types';
import QuestionnaireForm from './QuestionnaireForm';
import SpeechTestForm from './SpeechTestForm';
import PureToneAudiogram from './PureToneAudiogram';
import HaProtocolTab from './HaProtocolTab';
import { FileText, Headphones, Activity, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-6">
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
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[700px] overflow-hidden">
        <div className="p-8">
          {activeTab === 'HA' && isHA && <HaProtocolTab visit={visit} customer={customer} onSave={() => onSaveSuccess('프로토콜 데이터가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
          {activeTab === 'Q' && <QuestionnaireForm visit={visit} customer={customer} onSave={() => onSaveSuccess('상담 설문지가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
          {activeTab === 'SPEECH' && <SpeechTestForm visit={visit} customer={customer} onSave={() => onSaveSuccess('어음검사 결과가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
          {activeTab === 'PTA' && <PureToneAudiogram visit={visit} customer={customer} onSave={() => onSaveSuccess('순음청력검사 결과가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
        </div>
      </div>
    </div>
  );
});

VisitManager.displayName = 'VisitManager';

export default VisitManager;
