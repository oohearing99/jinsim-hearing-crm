// PDF 생성 후 JPG 변환 유틸리티
import jsPDF from 'jspdf';

export interface PDFPageConfig {
  element: HTMLElement;
  name: string;
}

/**
 * DOM 요소를 PDF 페이지로 추가
 */
const addElementToPDF = async (
  pdf: jsPDF,
  element: HTMLElement,
  pageIndex: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 원본 스타일 저장
    const originalStyles = {
      padding: element.style.padding,
      overflow: element.style.overflow,
      maxHeight: element.style.maxHeight,
      minHeight: element.style.minHeight,
      height: element.style.height,
      position: element.style.position,
    };

    // PDF 캡쳐용 스타일 적용
    element.style.padding = '40px';
    element.style.overflow = 'visible';
    element.style.maxHeight = 'none';
    element.style.minHeight = 'auto';
    element.style.height = 'auto';
    element.style.position = 'relative';

    // ResponsiveContainer 처리
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
        parent.style.minHeight = '600px';
        parent.style.maxHeight = 'none';
      }

      containerEl.style.overflow = 'visible';
      containerEl.style.height = 'auto';
      containerEl.style.minHeight = '600px';
      containerEl.style.maxHeight = 'none';
    });

    // DOM 재렌더링 대기
    setTimeout(() => {
      // 새 페이지 추가 (첫 페이지 제외)
      if (pageIndex > 0) {
        pdf.addPage();
      }

      // A4 크기 (210mm x 297mm)
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);

      // HTML을 이미지로 변환하여 PDF에 추가
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          windowWidth: Math.max(element.scrollWidth, 1200),
          windowHeight: Math.max(element.scrollHeight, 800),
        }).then((canvas) => {
          // 원본 스타일 복원
          Object.keys(originalStyles).forEach((key) => {
            element.style[key as any] = originalStyles[key as keyof typeof originalStyles];
          });

          // ResponsiveContainer 스타일 복원
          containerOriginalStyles.forEach(({ element: containerEl, styles }) => {
            Object.keys(styles).forEach(key => {
              containerEl.style[key as any] = styles[key];
            });
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * contentWidth) / canvas.width;

          // 이미지가 페이지 높이를 초과하는 경우 축소
          if (imgHeight > pageHeight - (margin * 2)) {
            const scale = (pageHeight - (margin * 2)) / imgHeight;
            pdf.addImage(
              imgData,
              'JPEG',
              margin,
              margin,
              imgWidth * scale,
              imgHeight * scale
            );
          } else {
            pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
          }

          resolve();
        }).catch(reject);
      }).catch(reject);
    }, 800);
  });
};

/**
 * PDF를 JPG 이미지 배열로 변환
 */
const convertPDFToImages = async (
  pdfBlob: Blob
): Promise<Array<{ name: string; blob: Blob }>> => {
  // pdfjs-dist를 동적으로 import
  const pdfjsLib = await import('pdfjs-dist');

  // Worker 설정
  if (typeof window !== 'undefined') {
    // @ts-ignore - worker module type
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(
      new Blob([pdfjsWorker], { type: 'application/javascript' })
    );
  }

  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: Array<{ name: string; blob: Blob }> = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = 2.5; // 고해상도
    const viewport = page.getViewport({ scale });

    // Canvas 생성
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // PDF 페이지를 Canvas에 렌더링
    // @ts-ignore - render parameters type mismatch
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    // Canvas를 JPG Blob으로 변환
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.95
      );
    });

    if (blob) {
      const index = String(i).padStart(2, '0');
      images.push({ name: `page-${index}.jpg`, blob });
    }
  }

  return images;
};

/**
 * 여러 DOM 요소를 PDF로 생성한 후 각 페이지를 JPG로 변환하여 ZIP으로 다운로드
 */
export const capturePagesAsJPG = async (
  pages: PDFPageConfig[],
  filename: string
): Promise<{ success: number; failed: number; images: Array<{ name: string; blob: Blob }> }> => {
  try {
    console.log('[PDF Capture] PDF 생성 시작:', pages.length, '페이지');

    // PDF 생성
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 각 요소를 PDF 페이지로 추가
    for (let i = 0; i < pages.length; i++) {
      console.log(`[PDF Capture] 페이지 ${i + 1}/${pages.length} 추가 중:`, pages[i].name);
      await addElementToPDF(pdf, pages[i].element, i);
      // 페이지 간 짧은 딜레이
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    console.log('[PDF Capture] PDF 생성 완료');

    // PDF를 Blob으로 변환
    const pdfBlob = pdf.output('blob');

    console.log('[PDF Capture] JPG 변환 시작');

    // PDF를 JPG 이미지들로 변환
    const images = await convertPDFToImages(pdfBlob);

    // 각 이미지에 실제 페이지 이름 할당
    const namedImages = images.map((img, index) => {
      const pageName = pages[index]?.name || `page-${index + 1}`;
      const indexStr = String(index + 1).padStart(2, '0');
      return {
        name: `${indexStr}-${pageName}.jpg`,
        blob: img.blob,
      };
    });

    console.log('[PDF Capture] 완료:', namedImages.length, '개 이미지 생성');

    return {
      success: namedImages.length,
      failed: pages.length - namedImages.length,
      images: namedImages,
    };
  } catch (error) {
    console.error('[PDF Capture] 오류 발생:', error);
    return {
      success: 0,
      failed: pages.length,
      images: [],
    };
  }
};

/**
 * 여러 이미지를 ZIP 파일로 다운로드
 */
export const downloadImagesAsZip = async (
  images: Array<{ name: string; blob: Blob }>,
  zipFilename: string
): Promise<void> => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // 폴더명에서 확장자 제거
  const folderName = zipFilename.replace('.zip', '');
  const folder = zip.folder(folderName);

  if (folder) {
    images.forEach(({ name, blob }) => {
      folder.file(name, blob);
    });

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // ZIP 파일 다운로드
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = zipFilename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  }
};
