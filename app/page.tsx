'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, Customer, Visit, VisitType, HAStage } from '@/types';
import { BRAND_ID, CENTER_ID, COUNSELOR_NAME } from '@/constants';
import CustomerSearch from '@/components/CustomerSearch';
import CustomerDetail from '@/components/CustomerDetail';
import VisitManager, { VisitManagerHandle } from '@/components/VisitManager';
import { Search, User, ClipboardList, UserCheck, MapPin, X, FileSpreadsheet, Settings, CheckCircle2, AlertCircle, Download, Upload, Database, Camera, FileEdit } from 'lucide-react';
import * as XLSX from 'xlsx';
import { downloadBackup, validateBackupFile, restoreBackup, getBackupStats, saveLastBackupTime, shouldRemindBackup } from '@/utils/backupUtils';
import { checkBlogImageSize } from '@/utils/captureUtils';

export default function Home() {
  const [view, setView] = useState<AppState>(AppState.SEARCH);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isCreatingVisit, setIsCreatingVisit] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScreenCaptureMode, setIsScreenCaptureMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showImageDestinationModal, setShowImageDestinationModal] = useState(false);

  const saveTriggerRef = useRef<() => void>(() => {});
  const visitManagerRef = useRef<VisitManagerHandle>(null);

  const [prefCounselor, setPrefCounselor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jinsim_pref_counselor') || COUNSELOR_NAME;
    }
    return COUNSELOR_NAME;
  });

  const [prefCenter, setPrefCenter] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jinsim_pref_center') || CENTER_ID;
    }
    return CENTER_ID;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jinsim_customers');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [visits, setVisits] = useState<Visit[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jinsim_visits');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jinsim_customers', JSON.stringify(customers));
    }
  }, [customers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jinsim_visits', JSON.stringify(visits));
    }
  }, [visits]);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 2500);
  };

  // 백업 알림 체크
  useEffect(() => {
    const checkBackupReminder = () => {
      if (shouldRemindBackup()) {
        setShowBackupReminder(true);
      }
    };
    checkBackupReminder();
  }, []);

  // 백업 실행
  const handleBackup = () => {
    try {
      const filename = downloadBackup();
      saveLastBackupTime();
      setShowBackupReminder(false);
      setIsBackupModalOpen(false);
      showToast(`백업 완료: ${filename}`);
    } catch (error) {
      showToast('백업 중 오류가 발생했습니다.');
      console.error('Backup error:', error);
    }
  };

  // 복원 실행
  const handleRestore = (file: File, mergeMode: 'replace' | 'merge') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const validation = validateBackupFile(content);

        if (!validation.valid || !validation.data) {
          showToast(validation.error || '잘못된 백업 파일입니다.');
          return;
        }

        const result = restoreBackup(validation.data, mergeMode);
        if (result.success) {
          showToast('데이터 복원이 완료되었습니다. 페이지를 새로고침합니다.');
          setIsRestoreModalOpen(false);
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast(result.error || '복원 중 오류가 발생했습니다.');
        }
      } catch (error) {
        showToast('파일을 읽을 수 없습니다.');
        console.error('Restore error:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setView(AppState.CUSTOMER_DETAIL);
  }, []);

  const handleSelectVisit = useCallback((visit: Visit) => {
    setSelectedVisit(visit);
    setIsDirty(false);
    setView(AppState.VISIT_DETAIL);
  }, []);

  const handleBack = () => {
    if (view === AppState.VISIT_DETAIL && isDirty) {
      setShowConfirmModal(true);
    } else {
      setView(AppState.CUSTOMER_DETAIL);
    }
  };

  const confirmSaveAndLeave = () => {
    if (saveTriggerRef.current) {
      saveTriggerRef.current();
    }
    setIsDirty(false);
    setShowConfirmModal(false);
    setView(AppState.CUSTOMER_DETAIL);
  };

  const confirmDiscardAndLeave = () => {
    setIsDirty(false);
    setShowConfirmModal(false);
    setView(AppState.CUSTOMER_DETAIL);
  };

  const handleCreateCustomer = (newCustomer: Partial<Customer>) => {
    const customer: Customer = {
      ...newCustomer,
      id: Math.random().toString(36).substr(2, 9),
      brand_id: BRAND_ID,
      center_id: prefCenter,
      counselor_name: prefCounselor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Customer;
    setCustomers(prev => [...prev, customer]);
    handleSelectCustomer(customer);
    showToast('신규 고객이 등록되었습니다.');
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setSelectedCustomer(updatedCustomer);
    showToast('고객 정보가 수정되었습니다.');
  };

  const handleFinalizeVisitCreate = (type: VisitType, stage: HAStage | null) => {
    if (!selectedCustomer) return;

    const stageLabels: Record<string, string> = {
      HA_1: '1차(기초평가/첫 착용)',
      HA_2: '2차(1주 후 적응체크)',
      HA_3: '3차(2주 후 심화조정)',
      AFTERCARE_3MO: '사후관리(3개월 점검)'
    };

    const nextRule = stage === 'HA_1' || stage === 'HA_2' ? 'WEEKLY' : '3MONTH';
    const nextDays = nextRule === 'WEEKLY' ? 7 : 90;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextDays);

    const newVisit: Visit = {
      id: Math.random().toString(36).substr(2, 9),
      customer_id: selectedCustomer.id,
      visit_date: new Date().toISOString().split('T')[0],
      purpose: stage ? [stageLabels[stage]] : ['일반 상담'],
      visit_type: type,
      ha_stage: stage,
      ha_stage_label: stage ? stageLabels[stage] : undefined,
      recommended_next_visit_date: stage ? nextDate.toISOString().split('T')[0] : null,
      next_visit_rule: stage ? nextRule : null,
      protocol_version: 'v1',
      brand_id: BRAND_ID,
      center_id: prefCenter,
      counselor_name: prefCounselor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setVisits(prev => [...prev, newVisit]);
    setIsCreatingVisit(false);
    handleSelectVisit(newVisit);
  };

  const exportToExcel = () => {
    if (typeof window === 'undefined') return;

    const wb = XLSX.utils.book_new();

    const getFlattenedData = (filterFn: (v: Visit) => boolean) => {
      return visits.filter(filterFn).map(v => {
        const customer = customers.find(c => c.id === v.customer_id);
        const haSession = JSON.parse(localStorage.getItem(`hasession_${v.id}`) || '{}');
        const speechData = JSON.parse(localStorage.getItem(`speech_${v.id}`) || '{}');
        const ptaData = JSON.parse(localStorage.getItem(`pta_${v.id}`) || '{}');
        const qDataByVisit = JSON.parse(localStorage.getItem(`q_${v.id}`) || '{}');
        const qDataByCustomer = JSON.parse(localStorage.getItem(`q_customer_${customer?.id}`) || '{}');
        const qData = Object.keys(qDataByCustomer).length > 0 ? qDataByCustomer : qDataByVisit;

        const row: any = {
          '방문일': v.visit_date,
          '방문ID': v.id,
          '성함': customer?.name || '-',
          '연락처': customer?.phone || '-',
          '생년월일': customer?.birth_date || '-',
          '나이': customer?.age || '-',
          '성별': customer?.gender === 'M' ? '남성' : customer?.gender === 'F' ? '여성' : '-',
          '주소': customer?.address || '-',
          '보호자명': customer?.guardian_name || '-',
          '보호자연락처': customer?.guardian_phone || '-',
          '장애등록여부': customer?.disability_status === 'Y' ? '예' : customer?.disability_status === 'N' ? '아니오' : '-',
          '장애등록일': customer?.disability_date || '-',
          '보청기경험(고객정보)': customer?.hearing_aid_experience === 'Y' ? '예' : customer?.hearing_aid_experience === 'N' ? '아니오' : '-',
          '수술이력': customer?.surgery_history === 'Y' ? '예' : customer?.surgery_history === 'N' ? '아니오' : '-',
          '상담자': v.counselor_name,
          '센터': v.center_id,
          '방문유형': v.visit_type === 'GENERAL' ? '일반상담' : 'HA프로토콜',
          '방문단계': v.ha_stage_label || '일반상담',
          '방문목적': v.purpose?.join(', ') || '-',
          '방문메모': v.memo || '-',
        };

        // 설문지 데이터
        if (qData.visit_motives) row['방문동기'] = qData.visit_motives.join(', ');
        if (qData.visit_motives_intro_name) row['소개자'] = qData.visit_motives_intro_name;
        if (qData.visit_motives_other) row['방문동기_기타'] = qData.visit_motives_other;

        row['청력검사경험'] = qData.hearing_test_experience || '-';
        if (qData.hearing_test_exp_note) row['청력검사경험_상세'] = qData.hearing_test_exp_note;

        row['최근1년이비인후과방문'] = qData.ent_visit_within_1y || '-';
        if (qData.ent_visit_note) row['이비인후과방문_상세'] = qData.ent_visit_note;

        row['보청기경험'] = qData.hearing_aid_experience || '-';
        if (qData.hearing_aid_exp_note) row['보청기경험_상세'] = qData.hearing_aid_exp_note;

        if (qData.hearing_loss_onset_note) row['발병시기'] = qData.hearing_loss_onset_note;

        row['중이염등치료경험'] = qData.ear_disease_treatment_history || '-';
        if (qData.ear_disease_note) row['중이염등치료_상세'] = qData.ear_disease_note;

        row['이명증상'] = qData.tinnitus || '-';
        if (qData.tinnitus_note) row['이명증상_상세'] = qData.tinnitus_note;

        if (qData.better_ear) row['더잘들리는귀'] = qData.better_ear;
        if (qData.desired_aid_ear) row['보청기희망위치'] = qData.desired_aid_ear;
        if (qData.phone_ear) row['전화받는쪽'] = qData.phone_ear;

        row['손움직임불편'] = qData.dexterity_issue || '-';
        if (qData.occupation_hobby) row['직업및취미'] = qData.occupation_hobby;

        // B & C 점수
        if (qData.diff_quiet_1to1 !== undefined) row['B13_조용한곳1대1대화'] = qData.diff_quiet_1to1;
        if (qData.diff_small_group !== undefined) row['B14_작은모임대화'] = qData.diff_small_group;
        if (qData.diff_background_noise !== undefined) row['B15_시끄러운곳대화'] = qData.diff_background_noise;
        if (qData.diff_party_multi_talkers !== undefined) row['B16_여러사람동시말하기'] = qData.diff_party_multi_talkers;
        if (qData.diff_reverberation_distance !== undefined) row['B17_울림있는곳거리'] = qData.diff_reverberation_distance;
        if (qData.diff_tv_volume !== undefined) row['B18_TV볼륨'] = qData.diff_tv_volume;
        if (qData.diff_phone_speech !== undefined) row['B19_전화통화'] = qData.diff_phone_speech;

        if (qData.aversive_loud_sounds !== undefined) row['C20_큰소리불편'] = qData.aversive_loud_sounds;
        if (qData.social_withdrawal !== undefined) row['C21_사회활동위축'] = qData.social_withdrawal;
        if (qData.emotional_impact !== undefined) row['C22_정서적영향'] = qData.emotional_impact;

        // 기대 및 우려
        if (qData.expectation_level) row['기대수준'] = qData.expectation_level;
        if (qData.expectation_other) row['기대수준_기타'] = qData.expectation_other;
        if (qData.concerns_multi) row['우려사항'] = qData.concerns_multi.join(', ');
        if (qData.concerns_other) row['우려사항_기타'] = qData.concerns_other;

        // COSI
        if (qData.cosi_top3_goals) {
          qData.cosi_top3_goals.forEach((g: any, i: number) => {
            row[`COSI_목표${i+1}_항목`] = g.category || '-';
            row[`COSI_목표${i+1}_상황`] = g.note || '-';
          });
        }

        // PTA (순음청력검사)
        const pt = haSession.results_detailed?.pure_tone || ptaData;
        if (pt) {
          // 모든 주파수 포함 (125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000Hz)
          const freqs = ['125', '250', '500', '750', '1000', '1500', '2000', '3000', '4000', '6000', '8000'];

          // 기도 (AC)
          freqs.forEach(f => {
            const rtAc = pt.ac_dbhl?.right?.[f] || pt.frequencies?.[f]?.rt_ac;
            const ltAc = pt.ac_dbhl?.left?.[f] || pt.frequencies?.[f]?.lt_ac;
            row[`AC_Rt_${f}Hz`] = rtAc !== null && rtAc !== undefined ? rtAc : '-';
            row[`AC_Lt_${f}Hz`] = ltAc !== null && ltAc !== undefined ? ltAc : '-';
          });

          // 음장 (SF)
          freqs.forEach(f => {
            const rtSf = pt.sf_dbhl?.right?.[f] || pt.frequencies?.[f]?.rt_sf;
            const ltSf = pt.sf_dbhl?.left?.[f] || pt.frequencies?.[f]?.lt_sf;
            if (rtSf !== null && rtSf !== undefined) row[`SF_Rt_${f}Hz`] = rtSf;
            if (ltSf !== null && ltSf !== undefined) row[`SF_Lt_${f}Hz`] = ltSf;
          });

          // 골도 (BC)
          freqs.forEach(f => {
            const rtBc = pt.bc_dbhl?.right?.[f] || pt.frequencies?.[f]?.rt_bc;
            const ltBc = pt.bc_dbhl?.left?.[f] || pt.frequencies?.[f]?.lt_bc;
            if (rtBc !== null && rtBc !== undefined) row[`BC_Rt_${f}Hz`] = rtBc;
            if (ltBc !== null && ltBc !== undefined) row[`BC_Lt_${f}Hz`] = ltBc;
          });

          // PTA 평균값
          if (pt.derived?.pta_right) row['PTA_평균_Rt'] = pt.derived.pta_right;
          if (pt.derived?.pta_left) row['PTA_평균_Lt'] = pt.derived.pta_left;
          if (pt.derived?.pta_sf_right) row['PTA_음장_Rt'] = pt.derived.pta_sf_right;
          if (pt.derived?.pta_sf_left) row['PTA_음장_Lt'] = pt.derived.pta_sf_left;

          // NR (무반응) 데이터
          if (pt.nr?.right?.length > 0) row['NR_AC_Rt'] = pt.nr.right.join(', ');
          if (pt.nr?.left?.length > 0) row['NR_AC_Lt'] = pt.nr.left.join(', ');
          if (pt.nr?.sf_right?.length > 0) row['NR_SF_Rt'] = pt.nr.sf_right.join(', ');
          if (pt.nr?.sf_left?.length > 0) row['NR_SF_Lt'] = pt.nr.sf_left.join(', ');

          // 추가 정보
          if (pt.test_date) row['순음검사일'] = pt.test_date;
          if (pt.transducer) row['변환기'] = pt.transducer;
          if (pt.masking_used !== null && pt.masking_used !== undefined) row['차폐사용'] = pt.masking_used ? '예' : '아니오';
          if (pt.notes) row['순음검사_메모'] = pt.notes;
        }

        // Speech (어음검사)
        const sp = haSession.results_detailed?.speech || speechData;
        if (sp) {
          const formatVal = (val: any) => Array.isArray(val) ? val.join(', ') : (val !== null && val !== undefined ? val : '-');

          // SRT (어음인지역치)
          row['SRT_Rt'] = formatVal(sp.srt_dbhl?.right || sp.rt?.srt);
          row['SRT_Lt'] = formatVal(sp.srt_dbhl?.left || sp.lt?.srt);
          row['SRT_FreeField'] = formatVal(sp.srt_dbhl?.free_field || sp.free_field?.srt);
          row['SRT_FreeField_Rt'] = formatVal(sp.srt_dbhl?.free_field_right || sp.free_field_rt?.srt);
          row['SRT_FreeField_Lt'] = formatVal(sp.srt_dbhl?.free_field_left || sp.free_field_lt?.srt);

          // WRS (어음명료도)
          row['WRS_Rt(%)'] = formatVal(sp.wrs?.right?.score_percent || sp.rt?.wrs_percent);
          row['WRS_Rt_List'] = sp.wrs?.right?.list_id || '-';
          row['WRS_Rt_Level'] = sp.wrs?.right?.level_dbhl !== null && sp.wrs?.right?.level_dbhl !== undefined ? sp.wrs.right.level_dbhl : '-';

          row['WRS_Lt(%)'] = formatVal(sp.wrs?.left?.score_percent || sp.lt?.wrs_percent);
          row['WRS_Lt_List'] = sp.wrs?.left?.list_id || '-';
          row['WRS_Lt_Level'] = sp.wrs?.left?.level_dbhl !== null && sp.wrs?.left?.level_dbhl !== undefined ? sp.wrs.left.level_dbhl : '-';

          row['WRS_FreeField(%)'] = formatVal(sp.wrs?.free_field?.score_percent || sp.free_field?.wrs_percent);
          row['WRS_FreeField_List'] = sp.wrs?.free_field?.list_id || '-';
          row['WRS_FreeField_Level'] = sp.wrs?.free_field?.level_dbhl !== null && sp.wrs?.free_field?.level_dbhl !== undefined ? sp.wrs.free_field.level_dbhl : '-';

          row['WRS_FreeField_Rt(%)'] = formatVal(sp.wrs?.free_field_right?.score_percent || sp.free_field_rt?.wrs_percent);
          row['WRS_FreeField_Rt_List'] = sp.wrs?.free_field_right?.list_id || '-';
          row['WRS_FreeField_Rt_Level'] = sp.wrs?.free_field_right?.level_dbhl !== null && sp.wrs?.free_field_right?.level_dbhl !== undefined ? sp.wrs.free_field_right.level_dbhl : '-';

          row['WRS_FreeField_Lt(%)'] = formatVal(sp.wrs?.free_field_left?.score_percent || sp.free_field_lt?.wrs_percent);
          row['WRS_FreeField_Lt_List'] = sp.wrs?.free_field_left?.list_id || '-';
          row['WRS_FreeField_Lt_Level'] = sp.wrs?.free_field_left?.level_dbhl !== null && sp.wrs?.free_field_left?.level_dbhl !== undefined ? sp.wrs.free_field_left.level_dbhl : '-';

          // MCL (최적쾌적레벨)
          row['MCL_Rt'] = formatVal(sp.mcl_dbhl?.right || sp.rt?.mcl);
          row['MCL_Lt'] = formatVal(sp.mcl_dbhl?.left || sp.lt?.mcl);
          row['MCL_FreeField'] = formatVal(sp.mcl_dbhl?.free_field || sp.free_field?.mcl);
          row['MCL_FreeField_Rt'] = formatVal(sp.mcl_dbhl?.free_field_right || sp.free_field_rt?.mcl);
          row['MCL_FreeField_Lt'] = formatVal(sp.mcl_dbhl?.free_field_left || sp.free_field_lt?.mcl);

          // UCL (불쾌레벨)
          row['UCL_Rt'] = formatVal(sp.ucl_dbhl?.right || sp.rt?.ucl);
          row['UCL_Lt'] = formatVal(sp.ucl_dbhl?.left || sp.lt?.ucl);
          row['UCL_FreeField'] = formatVal(sp.ucl_dbhl?.free_field || sp.free_field?.ucl);
          row['UCL_FreeField_Rt'] = formatVal(sp.ucl_dbhl?.free_field_right || sp.free_field_rt?.ucl);
          row['UCL_FreeField_Lt'] = formatVal(sp.ucl_dbhl?.free_field_left || sp.free_field_lt?.ucl);

          // 메모
          if (sp.wrs?.notes || sp.special_notes) row['어음검사_메모'] = sp.wrs?.notes || sp.special_notes;
        }

        // 중이검사 (Middle Ear)
        const me = haSession.results_detailed?.middle_ear;
        if (me && me.performed) {
          // 이경검사 (Otoscopy)
          if (me.otoscopy?.right) row['이경검사_Rt'] = me.otoscopy.right;
          if (me.otoscopy?.left) row['이경검사_Lt'] = me.otoscopy.left;
          if (me.otoscopy?.notes) row['이경검사_메모'] = me.otoscopy.notes;

          // 고막운동성검사 (Tympanometry)
          if (me.tympanometry?.right?.type) row['Tymp_Type_Rt'] = me.tympanometry.right.type;
          if (me.tympanometry?.right?.peak_pressure_daPa !== null && me.tympanometry?.right?.peak_pressure_daPa !== undefined) {
            row['Tymp_Peak_Rt(daPa)'] = me.tympanometry.right.peak_pressure_daPa;
          }
          if (me.tympanometry?.right?.compliance_ml !== null && me.tympanometry?.right?.compliance_ml !== undefined) {
            row['Tymp_Compliance_Rt(ml)'] = me.tympanometry.right.compliance_ml;
          }
          if (me.tympanometry?.right?.ecv_ml !== null && me.tympanometry?.right?.ecv_ml !== undefined) {
            row['Tymp_ECV_Rt(ml)'] = me.tympanometry.right.ecv_ml;
          }

          if (me.tympanometry?.left?.type) row['Tymp_Type_Lt'] = me.tympanometry.left.type;
          if (me.tympanometry?.left?.peak_pressure_daPa !== null && me.tympanometry?.left?.peak_pressure_daPa !== undefined) {
            row['Tymp_Peak_Lt(daPa)'] = me.tympanometry.left.peak_pressure_daPa;
          }
          if (me.tympanometry?.left?.compliance_ml !== null && me.tympanometry?.left?.compliance_ml !== undefined) {
            row['Tymp_Compliance_Lt(ml)'] = me.tympanometry.left.compliance_ml;
          }
          if (me.tympanometry?.left?.ecv_ml !== null && me.tympanometry?.left?.ecv_ml !== undefined) {
            row['Tymp_ECV_Lt(ml)'] = me.tympanometry.left.ecv_ml;
          }

          if (me.tympanometry?.notes) row['Tymp_메모'] = me.tympanometry.notes;
        }

        // 음장검사 (Sound Field - Aided)
        const sf = haSession.results_detailed?.sound_field;
        if (sf && sf.performed) {
          if (sf.aided_thresholds?.right) {
            Object.entries(sf.aided_thresholds.right).forEach(([freq, val]) => {
              if (val !== null && val !== undefined) row[`Aided_Rt_${freq}Hz`] = val;
            });
          }
          if (sf.aided_thresholds?.left) {
            Object.entries(sf.aided_thresholds.left).forEach(([freq, val]) => {
              if (val !== null && val !== undefined) row[`Aided_Lt_${freq}Hz`] = val;
            });
          }
          if (sf.aided_speech?.test_name) row['Aided_Speech_Test'] = sf.aided_speech.test_name;
          if (sf.aided_speech?.score_right !== null && sf.aided_speech?.score_right !== undefined) {
            row['Aided_Speech_Rt(%)'] = sf.aided_speech.score_right;
          }
          if (sf.aided_speech?.score_left !== null && sf.aided_speech?.score_left !== undefined) {
            row['Aided_Speech_Lt(%)'] = sf.aided_speech.score_left;
          }
          if (sf.aided_speech?.note) row['Aided_Speech_메모'] = sf.aided_speech.note;
        }

        // 검증 (Verification)
        const verif = haSession.results_detailed?.verification;
        if (verif) {
          // REM (실이측정)
          if (verif.rem?.performed !== null && verif.rem?.performed !== undefined) {
            row['REM_수행여부'] = verif.rem.performed ? '예' : '아니오';
          }
          if (verif.rem?.formula) row['REM_공식'] = verif.rem.formula;
          if (verif.rem?.target_match) row['REM_목표일치도'] = verif.rem.target_match;
          if (verif.rem?.mpo_safe !== null && verif.rem?.mpo_safe !== undefined) {
            row['REM_MPO안전'] = verif.rem.mpo_safe ? '안전' : '위험';
          }
          if (verif.rem?.summary) row['REM_요약'] = verif.rem.summary;

          // EAA (전기음향분석)
          if (verif.eaa?.performed !== null && verif.eaa?.performed !== undefined) {
            row['EAA_수행여부'] = verif.eaa.performed ? '예' : '아니오';
          }
          if (verif.eaa?.pass !== null && verif.eaa?.pass !== undefined) {
            row['EAA_통과여부'] = verif.eaa.pass ? '통과' : '미통과';
          }
          if (verif.eaa?.summary) row['EAA_요약'] = verif.eaa.summary;
        }

        // 데이터로깅
        const dl = haSession.results_detailed?.datalogging;
        if (dl) {
          if (dl.hours_per_day !== null && dl.hours_per_day !== undefined) {
            row['일평균착용시간'] = dl.hours_per_day;
          }
          if (dl.environment_notes) row['착용환경'] = dl.environment_notes;
          if (dl.note) row['데이터로깅_메모'] = dl.note;
        }

        // HA 프로토콜
        if (haSession.ha_stage) {
          const checklist = haSession.checklist || {};
          const checklistSummary = Object.entries(checklist)
            .filter(([_, value]: any) => value.status === 'DONE')
            .map(([key, _]) => key)
            .join(', ');
          if (checklistSummary) row['완료항목'] = checklistSummary;

          // 체크리스트 상세
          Object.entries(checklist).forEach(([key, value]: any) => {
            row[`체크_${key}_상태`] = value.status;
            if (value.note) row[`체크_${key}_메모`] = value.note;
          });

          if (haSession.adjustments?.programming_summary) row['프로그래밍요약'] = haSession.adjustments.programming_summary;
          if (haSession.adjustments?.gain_change_summary) row['이득변경'] = haSession.adjustments.gain_change_summary;
          if (haSession.adjustments?.noise_program_change) row['소음프로그램변경'] = haSession.adjustments.noise_program_change;
          if (haSession.adjustments?.feedback_management) row['피드백관리'] = haSession.adjustments.feedback_management;
          if (haSession.adjustments?.occlusion_management) row['폐쇄효과관리'] = haSession.adjustments.occlusion_management;

          const education = haSession.education || {};
          const eduItems = [];
          if (education.insertion_removal) eduItems.push('착탈');
          if (education.battery_charging) eduItems.push('배터리');
          if (education.cleaning_care) eduItems.push('청소');
          if (education.app_bluetooth) eduItems.push('앱/블루투스');
          if (education.adaptation_schedule_given) eduItems.push('적응일정');
          if (education.communication_strategies) eduItems.push('의사소통전략');
          if (eduItems.length > 0) row['교육완료항목'] = eduItems.join(', ');

          // 교육 상세
          if (education.insertion_removal !== null && education.insertion_removal !== undefined) {
            row['교육_착탈'] = education.insertion_removal ? '완료' : '미완료';
          }
          if (education.battery_charging !== null && education.battery_charging !== undefined) {
            row['교육_배터리'] = education.battery_charging ? '완료' : '미완료';
          }
          if (education.cleaning_care !== null && education.cleaning_care !== undefined) {
            row['교육_청소'] = education.cleaning_care ? '완료' : '미완료';
          }
          if (education.app_bluetooth !== null && education.app_bluetooth !== undefined) {
            row['교육_앱블루투스'] = education.app_bluetooth ? '완료' : '미완료';
          }
          if (education.adaptation_schedule_given !== null && education.adaptation_schedule_given !== undefined) {
            row['교육_적응일정'] = education.adaptation_schedule_given ? '완료' : '미완료';
          }
          if (education.communication_strategies !== null && education.communication_strategies !== undefined) {
            row['교육_의사소통전략'] = education.communication_strategies ? '완료' : '미완료';
          }

          // COSI 재평가
          if (haSession.validation?.cosi_top3_review) {
            const cosi = haSession.validation.cosi_top3_review;
            if (cosi.goal1) row['COSI_재평가_목표1'] = cosi.goal1;
            if (cosi.improvement_1 !== null && cosi.improvement_1 !== undefined) {
              row['COSI_재평가_목표1_개선도'] = cosi.improvement_1;
            }
            if (cosi.goal2) row['COSI_재평가_목표2'] = cosi.goal2;
            if (cosi.improvement_2 !== null && cosi.improvement_2 !== undefined) {
              row['COSI_재평가_목표2_개선도'] = cosi.improvement_2;
            }
            if (cosi.goal3) row['COSI_재평가_목표3'] = cosi.goal3;
            if (cosi.improvement_3 !== null && cosi.improvement_3 !== undefined) {
              row['COSI_재평가_목표3_개선도'] = cosi.improvement_3;
            }
          }

          if (haSession.validation?.satisfaction_0to10 !== null && haSession.validation?.satisfaction_0to10 !== undefined) {
            row['만족도(0-10)'] = haSession.validation.satisfaction_0to10;
          }
        }

        if (v.recommended_next_visit_date) row['다음방문예정일'] = v.recommended_next_visit_date;

        return row;
      });
    };

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customers), "고객정보");

    const allVisits = getFlattenedData(() => true);
    if (allVisits.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allVisits), "전체방문기록");

    const general = getFlattenedData(v => v.visit_type === 'GENERAL');
    if (general.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(general), "일반상담기록");

    ['HA_1', 'HA_2', 'HA_3', 'AFTERCARE_3MO'].forEach(st => {
      const data = getFlattenedData(v => v.ha_stage === st);
      const sheetNames: Record<string, string> = {
        'HA_1': 'HA1차_기초평가첫착용',
        'HA_2': 'HA2차_1주적응체크',
        'HA_3': 'HA3차_2주심화조정',
        'AFTERCARE_3MO': 'HA사후관리_3개월'
      };
      if (data.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheetNames[st]);
    });

    XLSX.writeFile(wb, `진심보청기_CRM_전체데이터_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('모든 검사 및 평가 결과가 엑셀로 내보내졌습니다.');
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('jinsim_pref_counselor', prefCounselor);
      localStorage.setItem('jinsim_pref_center', prefCenter);
    }
    setIsSettingsOpen(false);
    showToast('상담 정보가 고정되었습니다.');
  };

  // 이미지 캡쳐 핸들러 (VisitManager의 캡쳐 함수 호출)
  const handleCaptureImages = async () => {
    if (!selectedVisit || !selectedCustomer) {
      showToast('방문 정보를 먼저 선택해주세요.');
      return;
    }

    if (!visitManagerRef.current) {
      showToast('방문 화면으로 이동 후 다시 시도해주세요.');
      return;
    }

    setIsCapturing(true);
    try {
      await visitManagerRef.current.captureImages();
    } catch (error) {
      console.error('Capture error:', error);
      showToast('이미지 캡쳐 중 오류가 발생했습니다.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-[Pretendard]">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-500 p-2 rounded-lg shadow-lg shadow-blue-500/20"><ClipboardList className="w-6 h-6" /></div>
          <div><h1 className="font-bold text-lg leading-tight">진심보청기</h1><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hearing CRM v2.0</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { if(view === AppState.VISIT_DETAIL && isDirty) setShowConfirmModal(true); else setView(AppState.SEARCH); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppState.SEARCH ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}><Search className="w-5 h-5" /><span>고객 검색/등록</span></button>
          {selectedCustomer && (<button onClick={() => { if(view === AppState.VISIT_DETAIL && isDirty) setShowConfirmModal(true); else setView(AppState.CUSTOMER_DETAIL); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppState.CUSTOMER_DETAIL ? 'bg-blue-600 shadow-lg' : 'hover:bg-slate-800'}`}><User className="w-5 h-5" /><span>{selectedCustomer.name} 상세</span></button>)}
          <div className="pt-6 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Management</div>
          <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group"><FileSpreadsheet className="w-5 h-5 text-green-400" /><span>엑셀 내보내기</span></button>
          <div className="pt-4 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Data Safety</div>
          <button onClick={() => setIsBackupModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group relative">
            <Download className="w-5 h-5 text-blue-400" />
            <span>데이터 백업</span>
            {showBackupReminder && (
              <span className="absolute right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button onClick={() => setIsRestoreModalOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group"><Upload className="w-5 h-5 text-orange-400" /><span>데이터 복원</span></button>
          <button
            onClick={() => setIsScreenCaptureMode(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group"
            title="화면 캡처"
          >
            <Camera className="w-5 h-5 text-purple-400" />
            <span>이미지 캡처</span>
          </button>
          <button
            onClick={() => {
              // 새 창으로 블로그 포스팅 페이지 열기
              const blogUrl = selectedVisit && selectedCustomer
                ? `/blog-post?visitId=${selectedVisit.id}&customerId=${selectedCustomer.id}`
                : '/blog-post';
              window.open(blogUrl, 'jinsim-blog-post', 'width=900,height=800,scrollbars=yes,resizable=yes');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group"
            title="블로그 포스팅 작성"
          >
            <FileEdit className="w-5 h-5 text-pink-400" />
            <span>블로그 포스팅</span>
          </button>
          <button
            onClick={() => {
              // Streamlit 만족도 예측 앱 열기
              window.open('http://localhost:8501', '_blank', 'width=1200,height=900,scrollbars=yes,resizable=yes');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group"
            title="AI 만족도 예측 (Streamlit)"
          >
            <FileEdit className="w-5 h-5 text-emerald-400" />
            <span>만족도 예측</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Info</p><button onClick={() => setIsSettingsOpen(true)} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"><Settings className="w-4 h-4" /></button></div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold"><UserCheck className="w-3.5 h-3.5 text-blue-400" />{prefCounselor}</div>
                <div className="flex items-center gap-2 text-xs font-bold"><MapPin className="w-3.5 h-3.5 text-orange-400" />{prefCenter}</div>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{view === AppState.SEARCH && '고객 통합 관리'}{view === AppState.CUSTOMER_DETAIL && '고객 타임라인'}{view === AppState.VISIT_DETAIL && '상담 및 청능검사'}</h2>
          {view === AppState.VISIT_DETAIL && (<button onClick={handleBack} className="px-5 py-2.5 border-2 border-slate-100 rounded-xl text-sm font-black hover:bg-slate-50 transition-all flex items-center gap-2">돌아가기</button>)}
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {view === AppState.SEARCH && <CustomerSearch customers={customers} onSelect={handleSelectCustomer} onCreate={handleCreateCustomer} />}
            {view === AppState.CUSTOMER_DETAIL && selectedCustomer && (<CustomerDetail customer={selectedCustomer} visits={visits.filter(v => v.customer_id === selectedCustomer.id)} onSelectVisit={handleSelectVisit} onCreateVisit={() => setIsCreatingVisit(true)} onUpdateCustomer={handleUpdateCustomer} />)}
            {view === AppState.VISIT_DETAIL && selectedVisit && selectedCustomer && (<VisitManager ref={visitManagerRef} visit={selectedVisit} customer={selectedCustomer} onSaveSuccess={(msg) => { showToast(msg); setIsDirty(false); }} onDirtyChange={setIsDirty} saveTriggerRef={saveTriggerRef} />)}
          </div>
        </div>
      </main>

      {toast.show && (<div className="fixed top-8 right-8 z-[999] bg-slate-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500"><div className="bg-green-500 p-1.5 rounded-full shadow-lg shadow-green-500/20"><CheckCircle2 className="w-6 h-6 text-white" /></div><p className="font-black text-sm tracking-tight">{toast.message}</p></div>)}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 text-center space-y-4">
               <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertCircle className="w-10 h-10" />
               </div>
               <h3 className="text-2xl font-black text-slate-800">변경사항 저장 확인</h3>
               <p className="text-slate-500 font-bold leading-relaxed">저장하지 않은 변경사항이 있습니다.<br/>저장하고 돌아가시겠습니까?</p>
            </div>
            <div className="p-8 pt-0 space-y-3">
               <button onClick={confirmSaveAndLeave} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl transition-all">저장하고 돌아가기</button>
               <button onClick={confirmDiscardAndLeave} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all">저장 안 함</button>
               <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-all">취소</button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b flex justify-between items-center"><h3 className="text-xl font-black">정보 설정 고정</h3><button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button></div>
            <form onSubmit={handleUpdateSettings} className="p-8 space-y-5">
               <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">상담사 성함</label><input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={prefCounselor} onChange={e => setPrefCounselor(e.target.value)} /></div>
               <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">센터명</label><input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all" value={prefCenter} onChange={e => setPrefCenter(e.target.value)} /></div>
               <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-xl transition-all mt-4">설정값 고정 저장</button>
            </form>
          </div>
        </div>
      )}

      {isCreatingVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center"><h3 className="text-2xl font-black tracking-tight">방문 유형 선택</h3><button onClick={() => setIsCreatingVisit(false)} className="p-2 hover:bg-white rounded-full transition-all"><X className="w-6 h-6 text-slate-400" /></button></div>
            <div className="p-8 space-y-4">
               <button onClick={() => handleFinalizeVisitCreate('GENERAL', null)} className="w-full p-6 border-2 border-slate-100 rounded-[2rem] text-left hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-5 group shadow-sm hover:shadow-lg"><div className="bg-blue-100 p-4 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-md"><Search className="w-7 h-7" /></div><div><p className="font-black text-lg text-slate-800">일반 상담 / 청력 검사</p><p className="text-xs font-bold text-slate-500 mt-1">기초 문진 및 모든 임상 평가 포함</p></div></button>
               <div className="pt-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-3 border-l-4 border-orange-500">HA Protocol</p><div className="grid grid-cols-1 gap-3">{[{ id: 'HA_1', label: '1차(기초평가/첫 착용)' },{ id: 'HA_2', label: '2차(1주 후 적응체크)' },{ id: 'HA_3', label: '3차(2주 후 심화조정)' },{ id: 'AFTERCARE_3MO', label: '사후관리(3개월 점검)' }].map(st => (<button key={st.id} onClick={() => handleFinalizeVisitCreate('HA_PROTOCOL', st.id as HAStage)} className="w-full p-4 border-2 border-slate-50 rounded-2xl text-left hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center gap-4 group"><div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-all">{st.id.split('_').pop()}</div><p className="text-sm font-black text-slate-700">{st.label}</p></button>))}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* 백업 모달 */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 bg-gradient-to-r from-blue-50 to-blue-100 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl shadow-lg">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-blue-900">데이터 백업</h3>
              </div>
              <button onClick={() => setIsBackupModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-black text-amber-900">백업 권장 사항</p>
                    <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                      <li>주기적으로 백업하여 데이터 손실을 방지하세요</li>
                      <li>백업 파일은 안전한 장소에 보관하세요</li>
                      <li>브라우저 데이터 삭제 시 복원이 불가능합니다</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <p className="text-xs font-black text-slate-500 mb-3">백업 포함 항목</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-bold">고객 정보</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-bold">방문 기록</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-bold">검사 결과</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-bold">HA 프로토콜</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBackup}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-6 h-6" />
                지금 백업하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 복원 모달 */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 bg-gradient-to-r from-orange-50 to-orange-100 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-orange-900">데이터 복원</h3>
              </div>
              <button onClick={() => setIsRestoreModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-black text-red-900">주의사항</p>
                    <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                      <li>복원 시 현재 데이터가 덮어쓰기됩니다</li>
                      <li>복원 후 페이지가 자동으로 새로고침됩니다</li>
                      <li>반드시 현재 데이터를 먼저 백업하세요</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 mb-3">백업 파일 선택</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (window.confirm('현재 데이터를 모두 덮어쓰시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                        handleRestore(file, 'replace');
                      }
                    }
                  }}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200 cursor-pointer"
                />
              </div>
              <div className="text-center text-xs text-slate-500">
                <p className="font-bold">백업 파일은 .json 형식이어야 합니다</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 백업 알림 배너 */}
      {showBackupReminder && (
        <div className="fixed bottom-8 right-8 z-[100] bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-500 max-w-md">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-sm">백업을 권장합니다</p>
            <p className="text-xs opacity-90 mt-1">7일 이상 백업하지 않았습니다</p>
          </div>
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="bg-white text-orange-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-orange-50 transition-all"
          >
            백업하기
          </button>
          <button
            onClick={() => setShowBackupReminder(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 화면 캡처 오버레이 */}
      {isScreenCaptureMode && (
        <ScreenCaptureOverlay
          onClose={() => setIsScreenCaptureMode(false)}
          onCapture={(imageData) => {
            setIsScreenCaptureMode(false);
            setCapturedImage(imageData);
            setShowImageDestinationModal(true);
          }}
          onSizeCheck={(width, height) => {
            const result = checkBlogImageSize(width, height);
            showToast(result.message);
          }}
        />
      )}

      {/* 이미지 저장 위치 선택 모달 */}
      {showImageDestinationModal && capturedImage && (
        <ImageDestinationModal
          capturedImage={capturedImage}
          selectedVisit={selectedVisit}
          selectedCustomer={selectedCustomer}
          onClose={() => {
            setShowImageDestinationModal(false);
            setCapturedImage(null);
          }}
          onSave={(section: string, sessionId?: string) => {
            localStorage.setItem('jinsim_captured_image_section', section);
            if (sessionId) {
              localStorage.setItem('jinsim_captured_image_session_id', sessionId);
            }
            localStorage.setItem('jinsim_captured_image_data', capturedImage);
            setShowImageDestinationModal(false);
            setCapturedImage(null);
            showToast(`이미지가 저장되었습니다. 블로그 포스팅을 열어주세요.`);
          }}
          onDownload={() => {
            const link = document.createElement('a');
            link.href = capturedImage;
            link.download = `capture_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setShowImageDestinationModal(false);
            setCapturedImage(null);
            showToast('이미지가 다운로드되었습니다.');
          }}
        />
      )}
    </div>
  );
}

// 화면 캡처 오버레이 컴포넌트
function ScreenCaptureOverlay({ onClose, onCapture, onSizeCheck }: {
  onClose: () => void;
  onCapture: (imageData: string) => void;
  onSizeCheck?: (width: number, height: number) => void;
}) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // ESC 키로 취소
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsSelecting(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelecting) {
      setCurrentPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isSelecting) return;
    setIsSelecting(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width < 10 || height < 10) {
      onClose();
      return;
    }

    try {
      // 오버레이를 잠시 숨기고 캡처
      const overlay = document.getElementById('capture-overlay');
      if (overlay) {
        overlay.style.display = 'none';
      }

      // 약간의 지연 후 캡처 (DOM 업데이트를 위해)
      await new Promise(resolve => setTimeout(resolve, 50));

      // html2canvas를 사용하여 전체 페이지 캡처
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(document.body, {
        x: x + window.scrollX,
        y: y + window.scrollY,
        width: width,
        height: height,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2, // 고해상도로 캡처
      });

      const imageData = canvas.toDataURL('image/png');

      // 이미지 크기 체크 콜백 호출 (scale 2를 적용한 실제 크기)
      if (onSizeCheck) {
        onSizeCheck(canvas.width, canvas.height);
      }

      onCapture(imageData);
    } catch (error) {
      console.error('Capture error:', error);
      alert('캡처 중 오류가 발생했습니다.');
      onClose();
    }
  };

  const selectionStyle = {
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
  };

  // 실시간 크기 체크 (scale 2 적용된 크기 기준)
  const scaledWidth = selectionStyle.width * 2;
  const scaledHeight = selectionStyle.height * 2;
  const isLandscapeOrSquare = scaledWidth >= scaledHeight;
  const isOptimalSize = isLandscapeOrSquare
    ? scaledWidth >= 860  // 가로형: 860px 이상
    : scaledWidth >= 600; // 세로형: 600px 이상

  // 적정 크기면 녹색, 아니면 파란색
  const selectionColor = isOptimalSize ? 'green' : 'blue';

  return (
    <div
      id="capture-overlay"
      className="fixed inset-0 z-[9999] cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ background: 'rgba(0, 0, 0, 0.3)' }}
    >
      {/* 안내 메시지 */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-2xl z-[10000] pointer-events-none">
        <p className="text-sm font-bold text-slate-800">
          마우스를 드래그하여 캡처할 영역을 선택하세요 (ESC: 취소)
        </p>
      </div>

      {/* 선택 영역 표시 */}
      {isSelecting && (
        <div
          className={`absolute border-2 pointer-events-none ${
            isOptimalSize
              ? 'border-green-500 bg-green-500/20'
              : 'border-blue-500 bg-blue-500/20'
          }`}
          style={selectionStyle}
        >
          <div className={`absolute -top-6 left-0 text-white px-2 py-1 rounded text-xs font-bold ${
            isOptimalSize ? 'bg-green-500' : 'bg-blue-500'
          }`}>
            {Math.round(selectionStyle.width)} × {Math.round(selectionStyle.height)}
            {isOptimalSize && ' ✓'}
          </div>
        </div>
      )}
    </div>
  );
}

// 이미지 저장 위치 선택 모달 컴포넌트
function ImageDestinationModal({
  capturedImage,
  selectedVisit,
  selectedCustomer,
  onClose,
  onSave,
  onDownload
}: {
  capturedImage: string;
  selectedVisit: Visit | null;
  selectedCustomer: Customer | null;
  onClose: () => void;
  onSave: (section: string, sessionId?: string) => void;
  onDownload: () => void;
}) {
  // 블로그 포스팅 데이터 가져오기 - 모달이 열릴 때마다 최신 데이터 로드
  const [additionalSessions, setAdditionalSessions] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 사이드에서만 동작하도록 설정
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 서버 사이드 렌더링 시에는 실행하지 않음
    if (!mounted) return;

    const vId = selectedVisit?.id;
    const cId = selectedCustomer?.id;
    console.log('[ImageDestinationModal] Loading blog data for:', { vId, cId });

    if (vId && cId) {
      const storageKey = `jinsim_blog_post_${cId}_${vId}`;
      const savedData = localStorage.getItem(storageKey);
      console.log('[ImageDestinationModal] Storage key:', storageKey);
      console.log('[ImageDestinationModal] Saved data exists:', !!savedData);

      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          console.log('[ImageDestinationModal] Parsed data:', parsed);
          console.log('[ImageDestinationModal] Additional sessions:', parsed.additionalSessions);
          setAdditionalSessions(parsed.additionalSessions || []);
        } catch (e) {
          console.error('[ImageDestinationModal] Failed to parse blog data:', e);
          setAdditionalSessions([]);
        }
      } else {
        console.log('[ImageDestinationModal] No saved data found');
        setAdditionalSessions([]);
      }
    } else {
      console.log('[ImageDestinationModal] Missing visit or customer ID');
      setAdditionalSessions([]);
    }
  }, [mounted, selectedVisit, selectedCustomer]);

  const colors = [
    { bg: 'bg-orange-500', hover: 'hover:bg-orange-600', text: 'text-orange-500' },
    { bg: 'bg-cyan-500', hover: 'hover:bg-cyan-600', text: 'text-cyan-500' },
    { bg: 'bg-rose-500', hover: 'hover:bg-rose-600', text: 'text-rose-500' },
    { bg: 'bg-indigo-500', hover: 'hover:bg-indigo-600', text: 'text-indigo-500' },
    { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', text: 'text-amber-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-2xl font-black text-slate-800">캡처한 이미지를 어디에 저장할까요?</h3>
          <p className="text-sm text-slate-500 mt-2">블로그 포스팅의 저장 위치를 선택하세요</p>
        </div>

        <div className="p-6">
          {/* 이미지 미리보기 */}
          <div className="mb-6 border-2 border-slate-200 rounded-2xl overflow-hidden">
            <img src={capturedImage} alt="캡처된 이미지" className="w-full h-auto" />
          </div>

          {/* 저장 위치 선택 버튼들 */}
          <div className="space-y-3">
            <button
              onClick={() => onSave('hearingAidImage')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-blue-500 font-black flex items-center justify-center">1</div>
                보청기 상담
              </span>
              <span className="text-sm opacity-75">상담 이미지, 청력도 등</span>
            </button>

            <button
              onClick={() => onSave('hearingAidWearImage')}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-green-500 font-black flex items-center justify-center">2</div>
                보청기 착용
              </span>
              <span className="text-sm opacity-75">착용 이미지</span>
            </button>

            {/* 추가 회차들 */}
            {additionalSessions.map((session: any, index: number) => {
              const sessionNumber = index + 3;
              const color = colors[index % colors.length];
              const sessionTitle = session.title || '추가 회차';
              return (
                <button
                  key={session.id}
                  onClick={() => onSave('additionalSession', session.id)}
                  className={`w-full ${color.bg} ${color.hover} text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-between`}
                >
                  <span className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-white ${color.text} font-black flex items-center justify-center`}>{sessionNumber}</div>
                    {sessionTitle}
                  </span>
                  <span className="text-sm opacity-75">추가 회차 이미지</span>
                </button>
              );
            })}

            <button
              onClick={onDownload}
              className="w-full bg-slate-500 hover:bg-slate-600 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all"
            >
              다운로드만 하기
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-6 rounded-2xl font-bold transition-all"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
