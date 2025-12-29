'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileEdit, X, Plus, Trash2 } from 'lucide-react';

interface AdditionalSession {
  id: string;
  title: string;
  date: string;
  images: string[];
  description: string;
}

interface CenterInfo {
  centerName: string;
  directorName: string;
  directorPhilosophy: string;
}

interface PatientInfo {
  age: string;
  gender: string;
  visitReason: string;
  visitReasonCustom: string;
  testResult: string;
  testResultCustom: string;
  txOption: string;
  txOptionCustom: string;
}

// 선택 옵션 정의
const VISIT_REASON_OPTIONS = [
  '대화 시 청취 어려움',
  'TV 시청 시 청취 어려움',
  '전화 통화 시 청취 어려움',
  '소음 환경에서 대화 어려움',
  '가족/지인 권유',
  '청력검사 후 난청 진단',
  '기존 보청기 교체/업그레이드',
  '이명 증상 완화',
  '직장/업무상 필요',
  '기타'
];

const TEST_RESULT_OPTIONS = [
  '양측 경도 감각신경성 난청',
  '양측 중등도 감각신경성 난청',
  '양측 중고도 감각신경성 난청',
  '양측 고도 감각신경성 난청',
  '좌측 중등도 / 우측 경도 난청',
  '좌측 고도 / 우측 중등도 난청',
  '편측성 난청 (좌측)',
  '편측성 난청 (우측)',
  '혼합성 난청',
  '노인성 난청 (고음역 하강형)',
  '기타'
];

const TX_OPTION_OPTIONS = [
  '양측 RIC 보청기 착용',
  '양측 BTE 보청기 착용',
  '양측 ITC 보청기 착용',
  '양측 CIC 보청기 착용',
  '편측 RIC 보청기 착용 (좌)',
  '편측 RIC 보청기 착용 (우)',
  '편측 BTE 보청기 착용 (좌)',
  '편측 BTE 보청기 착용 (우)',
  '편측 CIC 보청기 착용 (좌)',
  '편측 CIC 보청기 착용 (우)',
  '오픈형 피팅',
  '폐쇄형 피팅 (이어몰드)',
  '기타'
];

export default function BlogPostPage() {
  const [blogData, setBlogData] = useState({
    hearingAidBrand: '',
    hearingAidDate: '',
    hearingAidImages: [] as string[],
    hearingAidWearDate: '',
    hearingAidWearImages: [] as string[],
    hearingAidWearDescription: ''
  });

  const [additionalSessions, setAdditionalSessions] = useState<AdditionalSession[]>([
    {
      id: `session-default-1`,
      title: '',
      date: '',
      images: [],
      description: ''
    }
  ]);
  const [customerName, setCustomerName] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitType, setVisitType] = useState('');
  const [visitId, setVisitId] = useState('');
  const [customerId, setCustomerId] = useState('');

  // 센터 정보 (localStorage에 저장하여 재사용)
  const [centerInfo, setCenterInfo] = useState<CenterInfo>({
    centerName: '',
    directorName: '',
    directorPhilosophy: ''
  });

  // 고객 정보
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    age: '',
    gender: '',
    visitReason: '',
    visitReasonCustom: '',
    testResult: '',
    testResultCustom: '',
    txOption: '',
    txOptionCustom: ''
  });

  // 캡처된 이미지 확인 및 로드 함수
  const loadCapturedImage = () => {
    const capturedSection = localStorage.getItem('jinsim_captured_image_section');
    const capturedData = localStorage.getItem('jinsim_captured_image_data');
    const capturedSessionId = localStorage.getItem('jinsim_captured_image_session_id');

    if (capturedSection && capturedData) {
      if (capturedSection === 'hearingAidImage') {
        setBlogData(prev => ({ ...prev, hearingAidImages: [...prev.hearingAidImages, capturedData] }));
      } else if (capturedSection === 'hearingAidWearImage') {
        setBlogData(prev => ({ ...prev, hearingAidWearImages: [...prev.hearingAidWearImages, capturedData] }));
      } else if (capturedSection === 'additionalSession' && capturedSessionId) {
        // 해당 세션 ID에 이미지 추가
        setAdditionalSessions(prev => {
          return prev.map(session =>
            session.id === capturedSessionId
              ? { ...session, images: [...session.images, capturedData] }
              : session
          );
        });
      }

      // 사용한 이미지 정보 제거
      localStorage.removeItem('jinsim_captured_image_section');
      localStorage.removeItem('jinsim_captured_image_data');
      localStorage.removeItem('jinsim_captured_image_session_id');
    }
  };

  useEffect(() => {
    // URL 파라미터에서 고객 및 방문 정보 가져오기
    const params = new URLSearchParams(window.location.search);
    const vId = params.get('visitId');
    const cId = params.get('customerId');

    if (vId && cId) {
      setVisitId(vId);
      setCustomerId(cId);

      // localStorage에서 저장된 블로그 데이터 불러오기
      const storageKey = `jinsim_blog_post_${cId}_${vId}`;
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setBlogData(parsed.blogData);
          setAdditionalSessions(parsed.additionalSessions);
          if (parsed.patientInfo) {
            setPatientInfo(parsed.patientInfo);
          }
        } catch (e) {
          console.error('Failed to parse saved blog data:', e);
        }
      }

      // localStorage에서 고객 및 방문 정보 가져오기
      const customers = JSON.parse(localStorage.getItem('jinsim_customers') || '[]');
      const visits = JSON.parse(localStorage.getItem('jinsim_visits') || '[]');

      const customer = customers.find((c: any) => c.id === cId);
      const visit = visits.find((v: any) => v.id === vId);

      if (customer) {
        setCustomerName(customer.name);
      }

      if (visit) {
        setVisitDate(visit.visit_date);
        setVisitType(visit.visit_type === 'GENERAL' ? '일반상담' : 'HA프로토콜');
      }
    }

    // 센터 정보 불러오기 (localStorage에서)
    const savedCenterInfo = localStorage.getItem('jinsim_center_info');
    if (savedCenterInfo) {
      try {
        setCenterInfo(JSON.parse(savedCenterInfo));
      } catch (e) {
        console.error('Failed to parse center info:', e);
      }
    }

    // 초기 로드 시 캡처된 이미지 확인
    loadCapturedImage();

    // 창이 포커스될 때 캡처된 이미지 확인 (다른 창에서 캡처 후 돌아올 때)
    const handleFocus = () => {
      loadCapturedImage();
    };

    // storage 이벤트 리스너 (다른 탭/창에서 localStorage 변경 시)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'jinsim_captured_image_data' && e.newValue) {
        loadCapturedImage();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // blogData나 additionalSessions 변경 시 자동 저장
  useEffect(() => {
    if (visitId && customerId) {
      const storageKey = `jinsim_blog_post_${customerId}_${visitId}`;
      const dataToSave = {
        blogData,
        additionalSessions,
        patientInfo
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [blogData, additionalSessions, patientInfo, visitId, customerId]);

  // 센터 정보 변경 시 localStorage에 저장 (모든 블로그 포스팅에서 재사용)
  useEffect(() => {
    if (centerInfo.centerName || centerInfo.directorName || centerInfo.directorPhilosophy) {
      localStorage.setItem('jinsim_center_info', JSON.stringify(centerInfo));
    }
  }, [centerInfo]);

  const handleImageUpload = async (field: 'hearingAidImages' | 'hearingAidWearImages', files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setBlogData(prev => ({
          ...prev,
          [field]: [...prev[field], imageData]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImageUpload = async (sessionId: string, files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setAdditionalSessions(prev => prev.map(session =>
          session.id === sessionId
            ? { ...session, images: [...session.images, imageData] }
            : session
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'hearingAidImages' | 'hearingAidWearImages', index: number) => {
    setBlogData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const removeSessionImage = (sessionId: string, index: number) => {
    setAdditionalSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, images: session.images.filter((_, i) => i !== index) }
        : session
    ));
  };

  const addSession = () => {
    const newSession: AdditionalSession = {
      id: `session-${Date.now()}`,
      title: '',
      date: '',
      images: [],
      description: ''
    };
    setAdditionalSessions(prev => [...prev, newSession]);
  };

  const removeSession = (sessionId: string) => {
    setAdditionalSessions(prev => prev.filter(session => session.id !== sessionId));
  };

  const updateSession = (sessionId: string, field: keyof AdditionalSession, value: string) => {
    setAdditionalSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, [field]: value }
        : session
    ));
  };

  const handleExport = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.saveAs || fileSaver.default;
      const zip = new JSZip();

      // 텍스트 정보 생성
      let textContent = `=== 센터 정보 ===
센터명: ${centerInfo.centerName || '-'}
원장 이름: ${centerInfo.directorName || '-'}
원장 철학: ${centerInfo.directorPhilosophy || '-'}

=== 고객 정보 ===
성함: ${customerName || '-'}
나이: ${patientInfo.age || '-'}
성별: ${patientInfo.gender || '-'}
내원동기: ${patientInfo.visitReason === '기타' ? patientInfo.visitReasonCustom : patientInfo.visitReason || '-'}
검사결과: ${patientInfo.testResult === '기타' ? patientInfo.testResultCustom : patientInfo.testResult || '-'}
Tx option: ${patientInfo.txOption === '기타' ? patientInfo.txOptionCustom : patientInfo.txOption || '-'}
방문일: ${visitDate || '-'}
방문유형: ${visitType || '-'}

=== 보청기 상담 (1회차) ===
보청기 상담 일자: ${blogData.hearingAidDate || 'YYYY-MM-DD'}
케이스 히스토리: ${blogData.hearingAidBrand || '-'}
보청기 상담 이미지: ${blogData.hearingAidImages?.length || 0}개

=== 보청기 착용 (2회차) ===
보청기 착용 일자: ${blogData.hearingAidWearDate || 'YYYY-MM-DD'}
보청기 착용 설명: ${blogData.hearingAidWearDescription || '-'}
보청기 착용 이미지: ${blogData.hearingAidWearImages?.length || 0}개
`;

      // 추가 회차 정보 추가
      if (additionalSessions && additionalSessions.length > 0) {
        textContent += '\n\n=== 추가 회차 ===\n';
        additionalSessions.forEach((session, index) => {
          textContent += `\n[${index + 3}회차]\n`;
          textContent += `제목: ${session.title || '-'}\n`;
          textContent += `날짜: ${session.date || 'YYYY-MM-DD'}\n`;
          textContent += `설명: ${session.description || '-'}\n`;
          textContent += `이미지: ${session.images?.length || 0}개\n`;
        });
      }

      textContent = textContent.trim();
      zip.file('블로그포스팅_내용.txt', textContent);

      // 이미지 저장
      let imageCount = 0;

      // 보청기 상담 이미지들
      if (blogData.hearingAidImages && blogData.hearingAidImages.length > 0) {
        blogData.hearingAidImages.forEach((image, idx) => {
          try {
            if (image && image.includes(',')) {
              const base64Data = image.split(',')[1];
              if (base64Data) {
                zip.file(`1_보청기상담_이미지_${idx + 1}.png`, base64Data, { base64: true });
                imageCount++;
              }
            }
          } catch (e) {
            console.error('Error processing hearingAidImage:', idx, e);
          }
        });
      }

      // 보청기 착용 이미지들
      if (blogData.hearingAidWearImages && blogData.hearingAidWearImages.length > 0) {
        blogData.hearingAidWearImages.forEach((image, idx) => {
          try {
            if (image && image.includes(',')) {
              const base64Data = image.split(',')[1];
              if (base64Data) {
                zip.file(`2_보청기착용_이미지_${idx + 1}.png`, base64Data, { base64: true });
                imageCount++;
              }
            }
          } catch (e) {
            console.error('Error processing hearingAidWearImage:', idx, e);
          }
        });
      }

      // 추가 회차 이미지 저장
      if (additionalSessions && additionalSessions.length > 0) {
        additionalSessions.forEach((session, sessionIndex) => {
          if (session.images && session.images.length > 0) {
            session.images.forEach((image, imgIdx) => {
              try {
                if (image && image.includes(',')) {
                  const base64Data = image.split(',')[1];
                  if (base64Data) {
                    const sessionNumber = sessionIndex + 3;
                    // 파일명에서 특수문자 제거
                    const safeTitle = (session.title || '추가회차').replace(/[/\\?%*:|"<>]/g, '_');
                    const filename = `${sessionNumber}_${safeTitle}_이미지_${imgIdx + 1}.png`;
                    zip.file(filename, base64Data, { base64: true });
                    imageCount++;
                  }
                }
              } catch (e) {
                console.error('Error processing session image:', sessionIndex, imgIdx, e);
              }
            });
          }
        });
      }

      // ZIP 파일 생성 및 다운로드
      const blob = await zip.generateAsync({ type: 'blob' });
      const safeCustomerName = (customerName || '고객').replace(/[/\\?%*:|"<>]/g, '_');
      const safeVisitDate = (visitDate || '날짜미정').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `블로그포스팅_${safeCustomerName}_${safeVisitDate}.zip`;
      saveAs(blob, filename);

      alert(`블로그 포스팅 자료가 다운로드되었습니다 (텍스트 1개, 이미지 ${imageCount}개)`);
    } catch (error) {
      console.error('Export error:', error);
      alert(`내보내기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6 font-[Pretendard]">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 bg-gradient-to-r from-pink-500 to-purple-500 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-lg">
                <FileEdit className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">블로그 포스팅</h1>
                <p className="text-sm text-pink-100 font-bold">
                  {customerName} ({visitDate})
                </p>
              </div>
            </div>
            <button
              onClick={() => window.close()}
              className="p-2 hover:bg-white/20 rounded-full transition-all"
              title="창 닫기"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-8 space-y-6">
            {/* 센터 정보 섹션 */}
            <div className="border-2 border-purple-200 rounded-3xl p-6 bg-gradient-to-r from-purple-50 to-pink-50">
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">🏢</div>
                센터 정보
                <span className="text-xs font-normal text-slate-500 ml-2">(한 번 입력하면 자동 저장됩니다)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">센터명</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-white border-2 border-purple-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-purple-100 transition-all"
                    placeholder="예: 진심보청기 송파센터"
                    value={centerInfo.centerName}
                    onChange={(e) => setCenterInfo(prev => ({ ...prev, centerName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">원장 이름</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-white border-2 border-purple-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-purple-100 transition-all"
                    placeholder="예: 홍길동"
                    value={centerInfo.directorName}
                    onChange={(e) => setCenterInfo(prev => ({ ...prev, directorName: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 mb-2">원장 철학</label>
                  <textarea
                    className="w-full p-4 bg-white border-2 border-purple-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-purple-100 transition-all resize-none"
                    placeholder="예: 고객의 청력을 가족처럼 돌보는 진심을 담았습니다."
                    rows={2}
                    value={centerInfo.directorPhilosophy}
                    onChange={(e) => setCenterInfo(prev => ({ ...prev, directorPhilosophy: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* 고객 정보 섹션 */}
            <div className="border-2 border-teal-200 rounded-3xl p-6 bg-gradient-to-r from-teal-50 to-cyan-50">
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">👤</div>
                고객 정보
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">나이</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                    placeholder="예: 65세"
                    value={patientInfo.age}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">성별</label>
                  <select
                    className="w-full p-4 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                    value={patientInfo.gender}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="">선택</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 mb-2">내원동기</label>
                  <select
                    className="w-full p-4 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                    value={patientInfo.visitReason}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, visitReason: e.target.value }))}
                  >
                    <option value="">선택하세요</option>
                    {VISIT_REASON_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {patientInfo.visitReason === '기타' && (
                    <input
                      type="text"
                      className="w-full p-4 mt-2 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                      placeholder="직접 입력하세요"
                      value={patientInfo.visitReasonCustom}
                      onChange={(e) => setPatientInfo(prev => ({ ...prev, visitReasonCustom: e.target.value }))}
                    />
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 mb-2">검사결과</label>
                  <select
                    className="w-full p-4 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                    value={patientInfo.testResult}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, testResult: e.target.value }))}
                  >
                    <option value="">선택하세요</option>
                    {TEST_RESULT_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {patientInfo.testResult === '기타' && (
                    <input
                      type="text"
                      className="w-full p-4 mt-2 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                      placeholder="직접 입력하세요"
                      value={patientInfo.testResultCustom}
                      onChange={(e) => setPatientInfo(prev => ({ ...prev, testResultCustom: e.target.value }))}
                    />
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 mb-2">Tx option</label>
                  <select
                    className="w-full p-4 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                    value={patientInfo.txOption}
                    onChange={(e) => setPatientInfo(prev => ({ ...prev, txOption: e.target.value }))}
                  >
                    <option value="">선택하세요</option>
                    {TX_OPTION_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {patientInfo.txOption === '기타' && (
                    <input
                      type="text"
                      className="w-full p-4 mt-2 bg-white border-2 border-teal-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-teal-100 transition-all"
                      placeholder="직접 입력하세요"
                      value={patientInfo.txOptionCustom}
                      onChange={(e) => setPatientInfo(prev => ({ ...prev, txOptionCustom: e.target.value }))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 보청기 상담 섹션 */}
            <div className="border-2 border-slate-100 rounded-3xl p-6 bg-slate-50">
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</div>
                보청기 상담
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">보청기 상담: YYYY-MM-DD</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={blogData.hearingAidDate}
                    onChange={(e) => setBlogData(prev => ({ ...prev, hearingAidDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">케이스 히스토리를 입력하세요</label>
                  <textarea
                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                    placeholder="예시: 식당·모임 말소리 분리 어려움/ 회의에서 말 놓침·피로 누적/ 소음 환경 명료도 개선 목적/ 보청기 적응 부담·처음 착용 불안 호소"
                    rows={3}
                    value={blogData.hearingAidBrand}
                    onChange={(e) => setBlogData(prev => ({ ...prev, hearingAidBrand: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">상담 이미지, 청력도, 등등 사진 추가 (여러 개 선택 가능)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="w-full p-4 bg-white border-2 border-dashed border-blue-300 rounded-2xl font-bold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer hover:border-blue-400 transition-all"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) handleImageUpload('hearingAidImages', files);
                      }}
                    />
                    {blogData.hearingAidImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {blogData.hearingAidImages.map((image, idx) => (
                          <div key={idx} className="relative group">
                            <img src={image} alt={`상담 이미지 ${idx + 1}`} className="w-full h-40 object-cover rounded-xl border-2 border-blue-200" />
                            <button
                              onClick={() => removeImage('hearingAidImages', idx)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 보청기 착용 섹션 */}
            <div className="border-2 border-slate-100 rounded-3xl p-6 bg-slate-50">
              <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">2</div>
                보청기 착용
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">보청기 착용 이미지: YYYY-MM-DD</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-green-100 transition-all"
                    value={blogData.hearingAidWearDate}
                    onChange={(e) => setBlogData(prev => ({ ...prev, hearingAidWearDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">설명</label>
                  <textarea
                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-green-100 transition-all resize-none"
                    placeholder="착용과 점검이 있었던 스토리를 소개해주세요"
                    rows={3}
                    value={blogData.hearingAidWearDescription}
                    onChange={(e) => setBlogData(prev => ({ ...prev, hearingAidWearDescription: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-2">이미지 추가 (여러 개 선택 가능)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="w-full p-4 bg-white border-2 border-dashed border-green-300 rounded-2xl font-bold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 cursor-pointer hover:border-green-400 transition-all"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) handleImageUpload('hearingAidWearImages', files);
                      }}
                    />
                    {blogData.hearingAidWearImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {blogData.hearingAidWearImages.map((image, idx) => (
                          <div key={idx} className="relative group">
                            <img src={image} alt={`착용 이미지 ${idx + 1}`} className="w-full h-40 object-cover rounded-xl border-2 border-green-200" />
                            <button
                              onClick={() => removeImage('hearingAidWearImages', idx)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 추가 회차 섹션들 */}
            {additionalSessions.map((session, index) => {
              const sessionNumber = index + 3;
              const colors = [
                { bg: 'bg-orange-500', border: 'border-orange-300', ring: 'focus:ring-orange-100', file: 'file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200', hover: 'hover:border-orange-400', imgBorder: 'border-orange-200' },
                { bg: 'bg-cyan-500', border: 'border-cyan-300', ring: 'focus:ring-cyan-100', file: 'file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200', hover: 'hover:border-cyan-400', imgBorder: 'border-cyan-200' },
                { bg: 'bg-rose-500', border: 'border-rose-300', ring: 'focus:ring-rose-100', file: 'file:bg-rose-100 file:text-rose-700 hover:file:bg-rose-200', hover: 'hover:border-rose-400', imgBorder: 'border-rose-200' },
                { bg: 'bg-indigo-500', border: 'border-indigo-300', ring: 'focus:ring-indigo-100', file: 'file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200', hover: 'hover:border-indigo-400', imgBorder: 'border-indigo-200' },
                { bg: 'bg-amber-500', border: 'border-amber-300', ring: 'focus:ring-amber-100', file: 'file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200', hover: 'hover:border-amber-400', imgBorder: 'border-amber-200' },
              ];
              const color = colors[index % colors.length];

              return (
                <div key={session.id} className="border-2 border-slate-100 rounded-3xl p-6 bg-slate-50 relative">
                  <button
                    onClick={() => removeSession(session.id)}
                    className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                    title="회차 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <h4 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${color.bg} text-white text-xs flex items-center justify-center`}>{sessionNumber}</div>
                    추가 회차
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-2">제목</label>
                      <input
                        type="text"
                        className={`w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none ${color.ring} transition-all`}
                        placeholder="예시: 보청기 소리조절, 보청기 재적합, AS방문 등"
                        value={session.title}
                        onChange={(e) => updateSession(session.id, 'title', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-2">날짜: YYYY-MM-DD</label>
                      <input
                        type="date"
                        className={`w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none ${color.ring} transition-all`}
                        value={session.date}
                        onChange={(e) => updateSession(session.id, 'date', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-2">설명</label>
                      <textarea
                        className={`w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none ${color.ring} transition-all resize-none`}
                        placeholder="이번 회차에 대한 설명을 입력하세요"
                        rows={3}
                        value={session.description}
                        onChange={(e) => updateSession(session.id, 'description', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-2">이미지 추가 (여러 개 선택 가능)</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className={`w-full p-4 bg-white border-2 border-dashed ${color.border} rounded-2xl font-bold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold ${color.file} cursor-pointer ${color.hover} transition-all`}
                          onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) handleAdditionalImageUpload(session.id, files);
                          }}
                        />
                        {session.images.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            {session.images.map((image, imgIdx) => (
                              <div key={imgIdx} className="relative group">
                                <img src={image} alt={`${session.title} 이미지 ${imgIdx + 1}`} className={`w-full h-40 object-cover rounded-xl border-2 ${color.imgBorder}`} />
                                <button
                                  onClick={() => removeSessionImage(session.id, imgIdx)}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                  {imgIdx + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 회차 추가 버튼 */}
            <div className="pt-2">
              <button
                onClick={addSession}
                className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-4 rounded-2xl font-black text-base hover:from-slate-700 hover:to-slate-800 shadow-lg transition-all flex items-center justify-center gap-3 border-2 border-dashed border-slate-300"
              >
                <Plus className="w-5 h-5" />
                회차 추가
              </button>
            </div>

            {/* 하단 버튼 */}
            <div className="pt-4">
              <button
                onClick={handleExport}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-5 rounded-2xl font-black text-lg hover:from-pink-600 hover:to-purple-600 shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                내보내기 (다운로드)
              </button>
              <p className="text-center text-xs text-slate-500 mt-3 font-bold">
                모든 내용과 이미지가 ZIP 파일로 다운로드됩니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
