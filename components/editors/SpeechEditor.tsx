
import React, { useState, useEffect, useMemo } from 'react';
import { DetailedSpeech, DetailedPureTone } from '../../types';
import { Headphones, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { calculatePTA, validateSrtPtaAgreement } from '../../utils/hearingUtils';

interface Props {
  data: DetailedSpeech;
  onChange: (data: DetailedSpeech) => void;
  pureToneData?: DetailedPureTone;
}

const SpeechEditor: React.FC<Props> = ({ data, onChange, pureToneData }) => {
  // SRT-PTA 일치도 검증
  const srtPtaValidation = useMemo(() => {
    if (!pureToneData) return null;

    const ptaRight = calculatePTA(pureToneData.ac_dbhl.right);
    const ptaLeft = calculatePTA(pureToneData.ac_dbhl.left);
    const srtRight = data.srt_dbhl.right && data.srt_dbhl.right.length > 0 ? data.srt_dbhl.right[0] : null;
    const srtLeft = data.srt_dbhl.left && data.srt_dbhl.left.length > 0 ? data.srt_dbhl.left[0] : null;

    return {
      right: validateSrtPtaAgreement(srtRight, ptaRight),
      left: validateSrtPtaAgreement(srtLeft, ptaLeft),
      ptaRight,
      ptaLeft
    };
  }, [data.srt_dbhl, pureToneData]);

  const updateField = (ear: 'right' | 'left' | 'free_field' | 'free_field_right' | 'free_field_left', category: 'srt' | 'mcl' | 'ucl', nums: number[]) => {
    const newData = { ...data };
    if (category === 'srt') newData.srt_dbhl[ear] = nums;
    else if (category === 'mcl') newData.mcl_dbhl[ear] = nums;
    else if (category === 'ucl') newData.ucl_dbhl[ear] = nums;
    onChange(newData);
  };

  const updateWrs = (ear: 'right' | 'left' | 'free_field' | 'free_field_right' | 'free_field_left', field: 'score_percent' | 'list_id' | 'level_dbhl', val: any) => {
    const newData = { ...data };
    if (!newData.wrs[ear]) newData.wrs[ear] = { list_id: null, level_dbhl: null, score_percent: [] };

    if (field === 'score_percent') {
      newData.wrs[ear]!.score_percent = val;
    } else if (field === 'level_dbhl') {
      newData.wrs[ear]!.level_dbhl = val === '' ? null : parseInt(val);
    } else {
      newData.wrs[ear]!.list_id = val;
    }
    onChange(newData);
  };

  const RenderManagedInput = ({ label, value, unit, onCommit, colorClass }: { label: string, value: number[] | null, unit: string, onCommit: (nums: number[]) => void, colorClass?: string }) => {
    const nums = value || [];
    const formatted = nums.map(v => `${v}${unit}`).join(', ');
    const hasValue = nums.length > 0;

    const [localValue, setLocalValue] = useState(formatted);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setLocalValue(formatted);
      }
    }, [formatted, isFocused]);

    const handleChange = (val: string) => {
      const cleaned = val.replace(/[^0-9,\s]/g, '');
      setLocalValue(cleaned);
    };

    const handleBlur = () => {
      setIsFocused(false);
      const parsed = localValue.split(/[,\s]+/).map(v => parseInt(v.trim())).filter(n => !isNaN(n));
      setLocalValue(parsed.map(v => `${v}${unit}`).join(', '));
      onCommit(parsed);
    };

    const handleFocus = () => {
      setIsFocused(true);
      const parsed = localValue.split(/[,\s]+/).map(v => parseInt(v.trim())).filter(n => !isNaN(n));
      setLocalValue(parsed.join(', '));
    };

    return (
      <div>
        <label className="text-xs font-black text-slate-500 block mb-2">{label}</label>
        <input
          type="text"
          className={`w-full p-4 border-2 rounded-xl font-black text-center text-lg outline-none transition-all
            ${hasValue ? colorClass || 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-white border-slate-200 text-slate-400'}
            focus:border-orange-400 focus:bg-orange-50`}
          value={localValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={e => handleChange(e.target.value)}
          placeholder="-"
        />
      </div>
    );
  };

  const renderEarColumn = (ear: 'right' | 'left' | 'free_field' | 'free_field_right' | 'free_field_left', label: string, bgColor: string, textColor: string, borderColor: string, colorClass: string) => {
    // data-capture 속성 결정
    const captureAttr = ear === 'right' ? 'speech-right' :
                        ear === 'left' ? 'speech-left' :
                        (ear === 'free_field_right' || ear === 'free_field_left') ? 'speech-freefield' : undefined;

    return (
    <div className={`p-6 rounded-3xl border-2 ${bgColor} ${borderColor} space-y-6 shadow-lg`} data-capture={captureAttr}>
      <div className={`flex items-center gap-3 pb-4 border-b ${borderColor}`}>
        <Headphones className={`w-6 h-6 ${textColor}`} />
        <h6 className={`font-black text-base uppercase tracking-widest ${textColor}`}>{label}</h6>
      </div>
      <div className="space-y-5">
        <RenderManagedInput label="SRS (dB HL)" value={data.srt_dbhl[ear]} unit="dB" onCommit={(nums) => updateField(ear, 'srt', nums)} colorClass={colorClass} />
        <div className="grid grid-cols-2 gap-3">
           <RenderManagedInput label="WRS (%)" value={data.wrs[ear]?.score_percent || []} unit="%" onCommit={(nums) => updateWrs(ear, 'score_percent', nums)} colorClass={colorClass} />
           <div>
             <label className="text-xs font-black text-slate-500 block mb-2">List</label>
             <input
               type="text"
               className={`w-full p-4 border-2 rounded-xl font-black text-center text-lg outline-none transition-all
                 ${data.wrs[ear]?.list_id ? colorClass : 'bg-white border-slate-200 text-slate-400'}
                 focus:border-orange-400 focus:bg-orange-50`}
               value={data.wrs[ear]?.list_id || ''}
               onChange={e => updateWrs(ear, 'list_id', e.target.value)}
               placeholder="-"
             />
           </div>
        </div>
        <RenderManagedInput label="MCL (dB HL)" value={data.mcl_dbhl[ear]} unit="dB" onCommit={(nums) => updateField(ear, 'mcl', nums)} colorClass={colorClass} />
        <RenderManagedInput label="UCL (dB HL)" value={data.ucl_dbhl[ear]} unit="dB" onCommit={(nums) => updateField(ear, 'ucl', nums)} colorClass={colorClass} />
      </div>
    </div>
  );
};

  return (
    <div className="space-y-6">
      {/* SRT-PTA 일치도 검증 */}
      {srtPtaValidation && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-capture="speech-validation">
          {/* 우측 SRT-PTA 일치도 */}
          <div className={`p-5 rounded-2xl border-2 ${
            srtPtaValidation.right.status === 'GOOD' ? 'bg-emerald-50 border-emerald-300' :
            srtPtaValidation.right.status === 'ACCEPTABLE' ? 'bg-blue-50 border-blue-300' :
            srtPtaValidation.right.status === 'POOR' ? 'bg-red-50 border-red-300' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {srtPtaValidation.right.status === 'GOOD' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : srtPtaValidation.right.status === 'ACCEPTABLE' ? (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              ) : srtPtaValidation.right.status === 'POOR' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-slate-400" />
              )}
              <h6 className="font-black text-sm text-slate-800">우측 SRT-PTA 일치도</h6>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">PTA (3분법)</span>
                <span className="text-sm font-black text-slate-800">{srtPtaValidation.ptaRight !== null ? `${srtPtaValidation.ptaRight} dB` : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">SRT</span>
                <span className="text-sm font-black text-slate-800">
                  {data.srt_dbhl.right && data.srt_dbhl.right.length > 0 ? `${data.srt_dbhl.right[0]} dB` : '-'}
                </span>
              </div>
              {srtPtaValidation.right.difference !== null && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-600">차이</span>
                  <span className={`text-lg font-black ${
                    srtPtaValidation.right.status === 'GOOD' ? 'text-emerald-600' :
                    srtPtaValidation.right.status === 'ACCEPTABLE' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>{srtPtaValidation.right.difference} dB</span>
                </div>
              )}
              <p className={`text-[10px] font-bold mt-2 ${
                srtPtaValidation.right.status === 'GOOD' ? 'text-emerald-700' :
                srtPtaValidation.right.status === 'ACCEPTABLE' ? 'text-blue-700' :
                srtPtaValidation.right.status === 'POOR' ? 'text-red-700' :
                'text-slate-500'
              }`}>{srtPtaValidation.right.message}</p>
            </div>
          </div>

          {/* 좌측 SRT-PTA 일치도 */}
          <div className={`p-5 rounded-2xl border-2 ${
            srtPtaValidation.left.status === 'GOOD' ? 'bg-emerald-50 border-emerald-300' :
            srtPtaValidation.left.status === 'ACCEPTABLE' ? 'bg-blue-50 border-blue-300' :
            srtPtaValidation.left.status === 'POOR' ? 'bg-red-50 border-red-300' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {srtPtaValidation.left.status === 'GOOD' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : srtPtaValidation.left.status === 'ACCEPTABLE' ? (
                <AlertCircle className="w-5 h-5 text-blue-600" />
              ) : srtPtaValidation.left.status === 'POOR' ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-slate-400" />
              )}
              <h6 className="font-black text-sm text-slate-800">좌측 SRT-PTA 일치도</h6>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">PTA (3분법)</span>
                <span className="text-sm font-black text-slate-800">{srtPtaValidation.ptaLeft !== null ? `${srtPtaValidation.ptaLeft} dB` : '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">SRT</span>
                <span className="text-sm font-black text-slate-800">
                  {data.srt_dbhl.left && data.srt_dbhl.left.length > 0 ? `${data.srt_dbhl.left[0]} dB` : '-'}
                </span>
              </div>
              {srtPtaValidation.left.difference !== null && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-600">차이</span>
                  <span className={`text-lg font-black ${
                    srtPtaValidation.left.status === 'GOOD' ? 'text-emerald-600' :
                    srtPtaValidation.left.status === 'ACCEPTABLE' ? 'text-blue-600' :
                    'text-red-600'
                  }`}>{srtPtaValidation.left.difference} dB</span>
                </div>
              )}
              <p className={`text-[10px] font-bold mt-2 ${
                srtPtaValidation.left.status === 'GOOD' ? 'text-emerald-700' :
                srtPtaValidation.left.status === 'ACCEPTABLE' ? 'text-blue-700' :
                srtPtaValidation.left.status === 'POOR' ? 'text-red-700' :
                'text-slate-500'
              }`}>{srtPtaValidation.left.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderEarColumn('right', 'Rt Ear (우측)', 'bg-red-50', 'text-red-600', 'border-red-200', 'bg-red-50 border-red-300 text-red-700')}
        {renderEarColumn('left', 'Lt Ear (좌측)', 'bg-blue-50', 'text-blue-600', 'border-blue-200', 'bg-blue-50 border-blue-300 text-blue-700')}
        {renderEarColumn('free_field_right', 'FF Rt (음장 우측)', 'bg-emerald-50', 'text-emerald-600', 'border-emerald-200', 'bg-emerald-50 border-emerald-300 text-emerald-700')}
        {renderEarColumn('free_field_left', 'FF Lt (음장 좌측)', 'bg-teal-50', 'text-teal-600', 'border-teal-200', 'bg-teal-50 border-teal-300 text-teal-700')}
      </div>
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">특이사항 (Special Notes)</label>
         <textarea className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs min-h-[80px]" value={data.wrs.notes || ''} onChange={e => onChange({...data, wrs: {...data.wrs, notes: e.target.value}})} placeholder="어음 명료도 측정 시 특이사항이나 보조도구 사용 여부 기록" />
      </div>
    </div>
  );
};

export default SpeechEditor;
