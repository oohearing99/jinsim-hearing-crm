
import React, { useMemo } from 'react';
import { DetailedPureTone } from '../../types';
import { CLINICAL_FREQS, BC_FREQS, SF_FREQS, calculatePTA, calculatePTA6, checkDisabilityEligibility, calculateABG, classifyHearingLoss, checkMaskingNeed } from '../../utils/hearingUtils';
import { Activity, AlertCircle, CheckCircle2, Waves, Stethoscope, Shield } from 'lucide-react';

interface Props {
  data: DetailedPureTone;
  onChange: (data: DetailedPureTone) => void;
}

const PureToneEditor: React.FC<Props> = ({ data, onChange }) => {
  // 6분법 PTA 계산 및 장애 진단 가능성 체크
  const pta6Analysis = useMemo(() => {
    const pta6Right = calculatePTA6(data.ac_dbhl.right);
    const pta6Left = calculatePTA6(data.ac_dbhl.left);
    const eligibility = checkDisabilityEligibility(pta6Right, pta6Left);
    return { pta6Right, pta6Left, eligibility };
  }, [data.ac_dbhl]);

  // ABG (Air-Bone Gap) 계산
  const abgAnalysis = useMemo(() => {
    const rightABG = calculateABG(data.ac_dbhl.right, data.bc_dbhl.right);
    const leftABG = calculateABG(data.ac_dbhl.left, data.bc_dbhl.left);
    return { right: rightABG, left: leftABG };
  }, [data.ac_dbhl, data.bc_dbhl]);

  // 난청 유형 및 정도 자동 분류
  const hearingClassification = useMemo(() => {
    const right = classifyHearingLoss(data.ac_dbhl.right, data.bc_dbhl.right);
    const left = classifyHearingLoss(data.ac_dbhl.left, data.bc_dbhl.left);
    return { right, left };
  }, [data.ac_dbhl, data.bc_dbhl]);

  // 차폐 필요 여부 체크
  const maskingCheck = useMemo(() => {
    return checkMaskingNeed(data.ac_dbhl.right, data.ac_dbhl.left, data.bc_dbhl.right, data.bc_dbhl.left);
  }, [data.ac_dbhl, data.bc_dbhl]);

  const updateThreshold = (side: 'right' | 'left', type: 'ac' | 'bc' | 'sf', freq: string, val: string) => {
    const num = val === '' ? null : parseInt(val);
    const newData = { ...data };

    if (type === 'ac') newData.ac_dbhl[side][freq] = num;
    else if (type === 'bc') newData.bc_dbhl[side][freq] = num;
    else if (type === 'sf') {
      if (!newData.sf_dbhl) newData.sf_dbhl = { right: {}, left: {} };
      newData.sf_dbhl[side][freq] = num;
    }

    // 값이 입력되면 performed를 true로 설정
    if (num !== null) {
      newData.performed = true;
    }

    // Auto calculate PTA
    newData.derived.pta_right = calculatePTA(newData.ac_dbhl.right);
    newData.derived.pta_left = calculatePTA(newData.ac_dbhl.left);
    if (newData.sf_dbhl) {
      newData.derived.pta_sf_right = calculatePTA(newData.sf_dbhl.right);
      newData.derived.pta_sf_left = calculatePTA(newData.sf_dbhl.left);
    }

    onChange(newData);
  };

  const toggleNR = (side: 'right' | 'left', type: 'ac' | 'bc' | 'sf_right' | 'sf_left', freq: string) => {
    const newData = { ...data };
    const sideKey = (type === 'sf_right') ? 'sf_right' : (type === 'sf_left' ? 'sf_left' : side);
    const list = newData.nr[sideKey as keyof typeof newData.nr];

    if (Array.isArray(list)) {
      newData.nr[sideKey as keyof typeof newData.nr] = list.includes(freq) ? list.filter(f => f !== freq) : [...list, freq];
    }
    onChange(newData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, side: string, type: string, freq: string) => {
    const freqIdx = CLINICAL_FREQS.indexOf(freq);
    // 각 테이블(우측/좌측) 내에서만 이동하도록 수정
    const rightRows = ['ac', 'sf', 'bc'];
    const leftRows = ['ac', 'sf', 'bc'];
    const currentRows = side === 'right' ? rightRows : leftRows;
    const rowIdx = currentRows.indexOf(type);

    // 해당 주파수에서 다음/이전 타입의 입력 필드가 존재하는지 확인하는 함수
    const canNavigateToType = (targetType: string, targetFreq: string): boolean => {
      if (targetType === 'ac') return true; // 기도는 모든 주파수에서 가능
      if (targetType === 'sf') return SF_FREQS.includes(targetFreq);
      if (targetType === 'bc') return BC_FREQS.includes(targetFreq);
      return false;
    };

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault(); // 숫자 증감 방지
        if (freqIdx < CLINICAL_FREQS.length - 1) {
          const nextFreq = CLINICAL_FREQS[freqIdx + 1];
          document.getElementById(`pta-${side}-${type}-${nextFreq}`)?.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault(); // 숫자 증감 방지
        if (freqIdx > 0) {
          const prevFreq = CLINICAL_FREQS[freqIdx - 1];
          document.getElementById(`pta-${side}-${type}-${prevFreq}`)?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault(); // 숫자 증감 방지
        // 같은 테이블 내에서 다음 행(기도→음장→골도)으로 이동
        for (let i = rowIdx + 1; i < currentRows.length; i++) {
          const nextType = currentRows[i];
          if (canNavigateToType(nextType, freq)) {
            document.getElementById(`pta-${side}-${nextType}-${freq}`)?.focus();
            break;
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault(); // 숫자 증감 방지
        // 같은 테이블 내에서 이전 행(골도→음장→기도)으로 이동
        for (let i = rowIdx - 1; i >= 0; i--) {
          const prevType = currentRows[i];
          if (canNavigateToType(prevType, freq)) {
            document.getElementById(`pta-${side}-${prevType}-${freq}`)?.focus();
            break;
          }
        }
        break;
    }
  };

  const renderCell = (side: 'right' | 'left', type: 'ac' | 'bc' | 'sf', freq: string) => {
    const nrKey = type === 'sf' ? (side === 'right' ? 'sf_right' : 'sf_left') : side;
    const isNR = data.nr[nrKey as keyof typeof data.nr]?.includes(freq);
    let val: number | null = null;

    if (type === 'ac') val = data.ac_dbhl[side][freq];
    else if (type === 'bc') val = data.bc_dbhl[side][freq];
    else if (type === 'sf') val = data.sf_dbhl?.[side]?.[freq];

    const hasValue = val !== null && val !== undefined;

    return (
      <div className="flex flex-col items-center gap-1">
        <input
          id={`pta-${side}-${type}-${freq}`}
          type="number"
          step="5"
          disabled={isNR}
          className={`w-full text-center p-3 rounded-lg border-2 transition-all text-base font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
            ${isNR ? 'bg-slate-100 border-slate-200 text-slate-400' :
              hasValue ? (side === 'right' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-blue-50 border-blue-300 text-blue-700') :
              'bg-white border-slate-200 text-slate-600 focus:border-orange-400 focus:bg-orange-50'}`}
          value={val ?? ''}
          onChange={e => updateThreshold(side, type, freq, e.target.value)}
          onKeyDown={e => handleKeyDown(e, side, type, freq)}
          onFocus={e => e.target.select()}
          placeholder="-"
        />
        <button
          tabIndex={-1}
          onClick={() => toggleNR(side, (type === 'sf' ? (side === 'right' ? 'sf_right' : 'sf_left') : type) as any, freq)}
          className={`text-[9px] font-black px-2 py-0.5 rounded-full transition-all ${isNR ? 'bg-red-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
        >
          NR
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Activity className="w-6 h-6 text-orange-600" />
          </div>
          <h5 className="font-black text-lg text-slate-800">순음청력검사 결과</h5>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-5 py-3 rounded-2xl border-2 ${pta6Analysis.pta6Right ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-black text-slate-500 block mb-1">우측 6분법</span>
            <span className={`text-2xl font-black ${pta6Analysis.pta6Right ? 'text-red-600' : 'text-slate-300'}`}>
              {pta6Analysis.pta6Right ?? '-'}
              {pta6Analysis.pta6Right && <span className="text-sm ml-1">dB</span>}
            </span>
          </div>
          <div className={`px-5 py-3 rounded-2xl border-2 ${pta6Analysis.pta6Left ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] font-black text-slate-500 block mb-1">좌측 6분법</span>
            <span className={`text-2xl font-black ${pta6Analysis.pta6Left ? 'text-blue-600' : 'text-slate-300'}`}>
              {pta6Analysis.pta6Left ?? '-'}
              {pta6Analysis.pta6Left && <span className="text-sm ml-1">dB</span>}
            </span>
          </div>
          {(pta6Analysis.pta6Right !== null && pta6Analysis.pta6Left !== null) && (
            <div className={`px-5 py-3 rounded-2xl border-2 flex items-center gap-2 ${
              pta6Analysis.eligibility.eligible
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-amber-50 border-amber-200'
            }`}>
              {pta6Analysis.eligibility.eligible ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <span className={`text-xs font-black block ${
                  pta6Analysis.eligibility.eligible ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {pta6Analysis.eligibility.eligible ? '청각장애 진단 가능성 높음' : '청각장애 진단 가능성 낮음'}
                </span>
                <span className="text-[10px] text-slate-500">{pta6Analysis.eligibility.reason}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 청능학적 분석 결과 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 난청 유형 및 정도 분류 */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-purple-600" />
            <h6 className="font-black text-sm text-purple-900">난청 분류</h6>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-700">우측</span>
                <span className="text-xs font-black text-purple-900">{hearingClassification.right.typeLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-purple-600">{hearingClassification.right.severityLabel}</span>
                <span className="text-[10px] text-purple-500">{hearingClassification.right.description}</span>
              </div>
            </div>
            <div className="border-t border-purple-200 pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-purple-700">좌측</span>
                <span className="text-xs font-black text-purple-900">{hearingClassification.left.typeLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-purple-600">{hearingClassification.left.severityLabel}</span>
                <span className="text-[10px] text-purple-500">{hearingClassification.left.description}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ABG (Air-Bone Gap) 분석 */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-5 border-2 border-teal-200">
          <div className="flex items-center gap-2 mb-4">
            <Waves className="w-5 h-5 text-teal-600" />
            <h6 className="font-black text-sm text-teal-900">기골도차 (ABG)</h6>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-700">우측 평균</span>
                <span className={`text-lg font-black ${abgAnalysis.right.hasSignificantABG ? 'text-red-600' : 'text-teal-900'}`}>
                  {abgAnalysis.right.avgABG !== null ? `${abgAnalysis.right.avgABG} dB` : '-'}
                </span>
              </div>
              <p className="text-[10px] text-teal-600">{abgAnalysis.right.message}</p>
            </div>
            <div className="border-t border-teal-200 pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-700">좌측 평균</span>
                <span className={`text-lg font-black ${abgAnalysis.left.hasSignificantABG ? 'text-blue-600' : 'text-teal-900'}`}>
                  {abgAnalysis.left.avgABG !== null ? `${abgAnalysis.left.avgABG} dB` : '-'}
                </span>
              </div>
              <p className="text-[10px] text-teal-600">{abgAnalysis.left.message}</p>
            </div>
          </div>
        </div>

        {/* 차폐 필요 여부 */}
        <div className={`bg-gradient-to-br rounded-2xl p-5 border-2 ${
          maskingCheck.needMasking
            ? 'from-orange-50 to-orange-100 border-orange-300'
            : 'from-slate-50 to-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className={`w-5 h-5 ${maskingCheck.needMasking ? 'text-orange-600' : 'text-slate-500'}`} />
            <h6 className={`font-black text-sm ${maskingCheck.needMasking ? 'text-orange-900' : 'text-slate-700'}`}>차폐 필요 여부</h6>
          </div>
          <div className="space-y-2">
            {maskingCheck.needMasking ? (
              <>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-black text-orange-700">차폐 필요</span>
                </div>
                <p className="text-[10px] text-orange-600 leading-relaxed">{maskingCheck.reason}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {maskingCheck.frequencies.map(freq => (
                    <span key={freq} className="px-2 py-1 bg-orange-200 text-orange-800 text-[9px] font-black rounded-full">
                      {freq}Hz
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black text-slate-600">차폐 불필요</span>
                </div>
                <p className="text-[10px] text-slate-500">{maskingCheck.reason}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white shadow-lg" data-capture="pure-tone-right">
        <table className="w-full text-center">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-4 border-r border-slate-700 font-black text-sm w-32">구분 (우측)</th>
              {CLINICAL_FREQS.map(f => <th key={f} className="p-4 border-r border-slate-700 font-bold text-sm">{f}<span className="text-slate-400 text-xs ml-0.5">Hz</span></th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-slate-100 hover:bg-red-50/30 transition-colors">
              <td className="p-4 font-black text-red-600 bg-red-50 border-r-2 border-slate-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border-2 border-red-500"></span>
                  우측 기도
                </div>
              </td>
              {CLINICAL_FREQS.map(f => <td key={f} className="p-2 border-r border-slate-100">{renderCell('right', 'ac', f)}</td>)}
            </tr>
            <tr className="border-b-2 border-slate-100 hover:bg-red-50/30 transition-colors">
              <td className="p-4 font-black text-red-600 bg-red-100/50 border-r-2 border-slate-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center text-red-500 font-black text-xs">A</span>
                  우측 음장
                </div>
              </td>
              {CLINICAL_FREQS.map(f => <td key={f} className="p-2 border-r border-slate-100">{SF_FREQS.includes(f) ? renderCell('right', 'sf', f) : <span className="text-slate-300">-</span>}</td>)}
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="p-4 font-black text-red-400 bg-slate-50 border-r-2 border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-black">&lt;</span>
                  우측 골도
                </div>
              </td>
              {CLINICAL_FREQS.map(f => <td key={f} className="p-2 border-r border-slate-100">{BC_FREQS.includes(f) ? renderCell('right', 'bc', f) : <span className="text-slate-300">-</span>}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 bg-white shadow-lg" data-capture="pure-tone-left">
        <table className="w-full text-center">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-4 border-r border-slate-700 font-black text-sm w-32">구분 (좌측)</th>
              {CLINICAL_FREQS.map(f => <th key={f} className="p-4 border-r border-slate-700 font-bold text-sm">{f}<span className="text-slate-400 text-xs ml-0.5">Hz</span></th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-slate-100 hover:bg-blue-50/30 transition-colors">
              <td className="p-4 font-black text-blue-600 bg-blue-50 border-r-2 border-slate-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center text-blue-500 font-black">×</span>
                  좌측 기도
                </div>
              </td>
              {CLINICAL_FREQS.map(f => <td key={f} className="p-2 border-r border-slate-100">{renderCell('left', 'ac', f)}</td>)}
            </tr>
            <tr className="border-b-2 border-slate-100 hover:bg-blue-50/30 transition-colors">
              <td className="p-4 font-black text-blue-600 bg-blue-100/50 border-r-2 border-slate-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center text-blue-500 font-black text-xs">A</span>
                  좌측 음장
                </div>
              </td>
              {CLINICAL_FREQS.map(f => <td key={f} className="p-2 border-r border-slate-100">{SF_FREQS.includes(f) ? renderCell('left', 'sf', f) : <span className="text-slate-300">-</span>}</td>)}
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="p-4 font-black text-blue-400 bg-slate-50 border-r-2 border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-black">&gt;</span>
                  좌측 골도
                </div>
              </td>
              {CLINICAL_FREQS.map(f => <td key={f} className="p-2 border-r border-slate-100">{BC_FREQS.includes(f) ? renderCell('left', 'bc', f) : <span className="text-slate-300">-</span>}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PureToneEditor;
