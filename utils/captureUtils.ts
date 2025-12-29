// UI 캡쳐 유틸리티 (네이버 블로그 포스팅용)
import html2canvas from 'html2canvas';

export interface CaptureSection {
  id: string;
  name: string;
  selector: string; // CSS selector for the element to capture
}

/**
 * DOM 요소를 캡쳐해서 JPG Blob 반환
 */
export const captureElementAsBlob = async (
  element: HTMLElement,
  quality: number = 0.95
): Promise<Blob | null> => {
  try {
    console.log('[Capture] 캡쳐 시작:', element.getAttribute('data-capture'));

    // 원래 스타일 저장 (모든 부모 요소 포함)
    const originalStyles: { [key: string]: string } = {
      padding: element.style.padding,
      overflow: element.style.overflow,
      maxHeight: element.style.maxHeight,
      minHeight: element.style.minHeight,
      height: element.style.height,
      width: element.style.width,
      maxWidth: element.style.maxWidth,
      position: element.style.position,
    };

    // 캡쳐를 위한 임시 스타일 적용
    element.style.padding = '120px'; // 여유 공간 대폭 증가
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.minHeight = 'auto';
    element.style.height = 'auto';
    element.style.maxWidth = 'none';
    element.style.position = 'relative';
    element.style.display = 'block';

    // 모든 자식 요소의 overflow 처리
    const allChildren = element.querySelectorAll('*');
    const childrenOriginalStyles: Array<{ element: HTMLElement; styles: any }> = [];

    allChildren.forEach((child) => {
      const childEl = child as HTMLElement;
      const computedStyle = window.getComputedStyle(childEl);

      // 모든 요소의 overflow와 높이 제약 제거
      childrenOriginalStyles.push({
        element: childEl,
        styles: {
          overflow: childEl.style.overflow,
          overflowX: childEl.style.overflowX,
          overflowY: childEl.style.overflowY,
          maxHeight: childEl.style.maxHeight,
          height: childEl.style.height,
          minHeight: childEl.style.minHeight,
        }
      });

      childEl.style.overflow = 'visible';
      childEl.style.overflowX = 'visible';
      childEl.style.overflowY = 'visible';
      childEl.style.maxHeight = 'none';

      // 고정 높이가 있는 경우 auto로 변경
      if (computedStyle.height && computedStyle.height !== 'auto' && !childEl.classList.contains('recharts-wrapper')) {
        childEl.style.height = 'auto';
      }
    });

    // ResponsiveContainer 특별 처리
    const responsiveContainers = element.querySelectorAll('.recharts-responsive-container');
    const containerOriginalStyles: Array<{ element: HTMLElement; styles: any }> = [];

    responsiveContainers.forEach((container) => {
      const containerEl = container as HTMLElement;
      const parent = containerEl.parentElement;

      containerOriginalStyles.push({
        element: containerEl,
        styles: {
          overflow: containerEl.style.overflow,
          height: containerEl.style.height,
          minHeight: containerEl.style.minHeight,
          maxHeight: containerEl.style.maxHeight,
        }
      });

      // 부모 요소의 높이도 저장
      if (parent) {
        containerOriginalStyles.push({
          element: parent,
          styles: {
            overflow: parent.style.overflow,
            height: parent.style.height,
            minHeight: parent.style.minHeight,
            maxHeight: parent.style.maxHeight,
          }
        });
        parent.style.overflow = 'visible';
        parent.style.height = 'auto';
        parent.style.minHeight = 'auto';
        parent.style.maxHeight = 'none';
      }

      containerEl.style.overflow = 'visible';
      containerEl.style.height = 'auto';
      containerEl.style.minHeight = '800px'; // 최소 높이 대폭 증가
      containerEl.style.maxHeight = 'none';
    });

    // DOM 재렌더링 대기 (충분한 시간 확보)
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초로 증가

    // 실제 렌더링된 크기 정확하게 계산
    const rect = element.getBoundingClientRect();
    const actualWidth = Math.max(
      element.scrollWidth,
      element.offsetWidth,
      rect.width
    );
    const actualHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      rect.height
    );

    console.log('[Capture] 계산된 크기:', { actualWidth, actualHeight });

    // html2canvas 옵션 최적화
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // 안정성을 위해 2로 설정
      logging: true, // 디버깅을 위해 로깅 활성화
      useCORS: true,
      allowTaint: true,
      width: actualWidth + 240, // 패딩 120px * 2
      height: actualHeight + 240,
      windowWidth: actualWidth + 240,
      windowHeight: actualHeight + 240,
      x: -120, // 패딩만큼 시작점 조정
      y: -120,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false, // SVG 렌더링 문제 방지
      imageTimeout: 15000, // 이미지 로드 대기 시간 증가
    });

    console.log('[Capture] Canvas 생성 완료:', { width: canvas.width, height: canvas.height });

    // 원래 스타일 복원
    Object.keys(originalStyles).forEach(key => {
      element.style[key as any] = originalStyles[key];
    });

    // 모든 자식 요소 스타일 복원
    childrenOriginalStyles.forEach(({ element: childEl, styles }) => {
      Object.keys(styles).forEach(key => {
        childEl.style[key as any] = styles[key];
      });
    });

    // ResponsiveContainer 스타일 복원
    containerOriginalStyles.forEach(({ element: containerEl, styles }) => {
      Object.keys(styles).forEach(key => {
        containerEl.style[key as any] = styles[key];
      });
    });

    // Canvas를 JPG Blob으로 변환
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('[Capture] Blob 생성 완료:', { size: blob.size });
          }
          resolve(blob);
        },
        'image/jpeg',
        quality
      );
    });
  } catch (error) {
    console.error('[Capture] 오류 발생:', error);
    return null;
  }
};

/**
 * DOM 요소를 캡쳐해서 JPG 파일로 다운로드
 */
export const captureElementAsJpg = async (
  element: HTMLElement,
  filename: string,
  quality: number = 0.95
): Promise<void> => {
  try {
    // 요소에 임시 padding 추가하여 텍스트 잘림 방지
    const originalPadding = element.style.padding;
    element.style.padding = '20px';

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 3, // 고해상도 (2 → 3)
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth + 40, // 여유 공간
      windowHeight: element.scrollHeight + 40,
    });

    // 원래 padding 복원
    element.style.padding = originalPadding;

    // Canvas를 JPG로 변환
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Failed to create blob');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      'image/jpeg',
      quality
    );
  } catch (error) {
    console.error('Capture error:', error);
    throw error;
  }
};

/**
 * 여러 섹션을 순차적으로 캡쳐
 */
export const captureMultipleSections = async (
  sections: CaptureSection[],
  prefix: string,
  delay: number = 300
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  console.log(`[Capture] 캡쳐 시작: ${sections.length}개 섹션`);

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    try {
      const element = document.querySelector(section.selector) as HTMLElement;
      if (!element) {
        console.warn(`[Capture] 요소를 찾을 수 없음: ${section.selector} (${section.name})`);
        failed++;
        continue;
      }

      const filename = `${prefix}-${String(i + 1).padStart(2, '0')}-${section.name}.jpg`;
      console.log(`[Capture] 캡쳐 중: ${section.name}...`);
      await captureElementAsJpg(element, filename);
      success++;
      console.log(`[Capture] ✓ 성공: ${section.name}`);

      // 다음 캡쳐 전 딜레이 (브라우저가 파일 저장을 처리할 시간)
      if (i < sections.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`[Capture] ✗ 실패: ${section.name}`, error);
      failed++;
    }
  }

  console.log(`[Capture] 완료: 성공 ${success}개, 실패 ${failed}개`);
  return { success, failed };
};

/**
 * 일반상담 캡쳐 섹션 정의
 */
export const getGeneralConsultationSections = (): CaptureSection[] => [
  { id: 'customer-info', name: '고객정보', selector: '[data-capture="customer-info"]' },
  { id: 'consultation-content', name: '상담내용', selector: '[data-capture="consultation-content"]' },
  { id: 'questionnaire', name: '설문지', selector: '[data-capture="questionnaire"]' },
];

/**
 * HA 프로토콜 캡쳐 섹션 정의 (1차/2차/3차 공통)
 * 실제 DOM에 존재하는 data-capture 속성만 포함
 */
export const getHaProtocolSections = (): CaptureSection[] => [
  { id: 'customer-info', name: '고객정보', selector: '[data-capture="customer-info"]' },
  { id: 'visit-summary', name: '방문요약', selector: '[data-capture="visit-summary"]' },
  { id: 'pure-tone-analysis', name: '순음검사-분석결과', selector: '[data-capture="pure-tone-analysis"]' },
  { id: 'pure-tone-right', name: '순음검사-우측', selector: '[data-capture="pure-tone-right"]' },
  { id: 'pure-tone-left', name: '순음검사-좌측', selector: '[data-capture="pure-tone-left"]' },
  { id: 'speech-validation', name: '어음검사-일치도검증', selector: '[data-capture="speech-validation"]' },
  { id: 'speech-right', name: '어음검사-우측', selector: '[data-capture="speech-right"]' },
  { id: 'speech-left', name: '어음검사-좌측', selector: '[data-capture="speech-left"]' },
  { id: 'speech-freefield', name: '어음검사-음장', selector: '[data-capture="speech-freefield"]' },
];

/**
 * 사후관리 캡쳐 섹션 정의
 */
export const getAftercareSections = (): CaptureSection[] => [
  { id: 'customer-info', name: '고객정보', selector: '[data-capture="customer-info"]' },
  { id: 'aftercare-content', name: '사후관리내용', selector: '[data-capture="aftercare-content"]' },
  { id: 'maintenance-log', name: '유지보수기록', selector: '[data-capture="maintenance-log"]' },
];

/**
 * 방문 유형에 따른 캡쳐 섹션 가져오기
 */
export const getSectionsForVisitType = (visitType: string): CaptureSection[] => {
  switch (visitType) {
    case 'general':
      return getGeneralConsultationSections();
    case 'ha_protocol_stage1':
    case 'ha_protocol_stage2':
    case 'ha_protocol_stage3':
      return getHaProtocolSections();
    case 'aftercare':
      return getAftercareSections();
    default:
      return [];
  }
};

/**
 * 방문 정보로 파일명 prefix 생성
 */
export const generateFilenamePrefix = (
  customerName: string,
  visitType: string,
  visitDate: string
): string => {
  const typeMap: Record<string, string> = {
    general: '일반상담',
    ha_protocol_stage1: 'HA1차',
    ha_protocol_stage2: 'HA2차',
    ha_protocol_stage3: 'HA3차',
    aftercare: '사후관리',
  };

  const typeLabel = typeMap[visitType] || visitType;
  const dateStr = visitDate.replace(/[-:]/g, '').substring(0, 8); // YYYYMMDD

  return `${customerName}_${typeLabel}_${dateStr}`;
};

/**
 * 전체 방문 정보를 카테고리별로 캡쳐
 */
export const captureVisitByCategory = async (
  customerName: string,
  visitType: string,
  visitDate: string
): Promise<{ success: number; failed: number; total: number }> => {
  const sections = getSectionsForVisitType(visitType);
  const prefix = generateFilenamePrefix(customerName, visitType, visitDate);

  const result = await captureMultipleSections(sections, prefix);

  return {
    ...result,
    total: sections.length,
  };
};
