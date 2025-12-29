
import React, { useState, useEffect } from 'react';
import { Visit, Customer, SpeechTestData, EarTestValue, DetailedSpeech } from '../types';
import { BRAND_ID } from '../constants';
import { Save, Headphones } from 'lucide-react';

interface Props {
  visit: Visit;
  customer: Customer;
  onSave: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  saveTriggerRef: React.MutableRefObject<() => void>;
}

const SpeechTestForm: React.FC<Props> = ({ visit, customer, onSave, onDirtyChange, saveTriggerRef }) => {
  const prefCounselor = localStorage.getItem('jinsim_pref_counselor') || 'Admin';
  const prefCenter = localStorage.getItem('jinsim_pref_center') || 'SEOUL_MAIN';

  const [data, setData] = useState<SpeechTestData>(() => {
    const haSaved = localStorage.getItem(`hasession_${visit.id}`);
    const spSaved = localStorage.getItem(`speech_${visit.id}`);

    if (haSaved) {
      const ha = JSON.parse(haSaved);
      const sp = ha.results_detailed?.speech as DetailedSpeech;
      if (sp) {
        return {
          visit_id: visit.id,
          customer_id: customer.id,
          rt: { srt: sp.srt_dbhl.right || [], wrs_percent: sp.wrs.right?.score_percent || [], mcl: sp.mcl_dbhl.right || [], ucl: sp.ucl_dbhl.right || [] },
          lt: { srt: sp.srt_dbhl.left || [], wrs_percent: sp.wrs.left?.score_percent || [], mcl: sp.mcl_dbhl.left || [], ucl: sp.ucl_dbhl.left || [] },
          free_field: { srt: sp.srt_dbhl.free_field || [], wrs_percent: sp.wrs.free_field?.score_percent || [], mcl: sp.mcl_dbhl.free_field || [], ucl: sp.ucl_dbhl.free_field || [] },
          free_field_rt: {},
          free_field_lt: {},
          special_notes: sp.wrs.notes,
          brand_id: BRAND_ID,
          center_id: prefCenter,
          counselor_name: prefCounselor,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }

    return spSaved ? JSON.parse(spSaved) : {
      visit_id: visit.id,
      customer_id: customer.id,
      rt: {}, lt: {}, free_field: {}, free_field_rt: {}, free_field_lt: {},
      brand_id: BRAND_ID,
      center_id: prefCenter,
      counselor_name: prefCounselor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const handleSave = () => {
    const finalData = { ...data, updated_at: new Date().toISOString() };
    localStorage.setItem(`speech_${visit.id}`, JSON.stringify(finalData));

    const haSaved = localStorage.getItem(`hasession_${visit.id}`);
    if (haSaved) {
      const ha = JSON.parse(haSaved);
      if (!ha.results_detailed) ha.results_detailed = {};

      // Merge free_field data: use new free_field_rt/lt if available, otherwise fall back to old free_field
      const freeFieldSrt = data.free_field_rt?.srt || data.free_field_lt?.srt || data.free_field?.srt || null;
      const freeFieldWrs = data.free_field_rt?.wrs_percent || data.free_field_lt?.wrs_percent || data.free_field?.wrs_percent || null;
      const freeFieldMcl = data.free_field_rt?.mcl || data.free_field_lt?.mcl || data.free_field?.mcl || null;
      const freeFieldUcl = data.free_field_rt?.ucl || data.free_field_lt?.ucl || data.free_field?.ucl || null;

      ha.results_detailed.speech = {
        srt_dbhl: { right: data.rt.srt || null, left: data.lt.srt || null, free_field: freeFieldSrt },
        wrs: {
          right: { score_percent: data.rt.wrs_percent || null, list_id: null, level_dbhl: null },
          left: { score_percent: data.lt.wrs_percent || null, list_id: null, level_dbhl: null },
          free_field: { score_percent: freeFieldWrs, list_id: null, level_dbhl: null },
          notes: data.special_notes
        },
        mcl_dbhl: { right: data.rt.mcl || null, left: data.lt.mcl || null, free_field: freeFieldMcl },
        ucl_dbhl: { right: data.rt.ucl || null, left: data.lt.ucl || null, free_field: freeFieldUcl }
      };
      localStorage.setItem(`hasession_${visit.id}`, JSON.stringify(ha));
    }
    onDirtyChange(false);
    onSave();
  };

  useEffect(() => {
    saveTriggerRef.current = handleSave;
  }, [data]);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    const finalData = { ...data, updated_at: new Date().toISOString() };
    localStorage.setItem(`speech_${visit.id}`, JSON.stringify(finalData));
  }, [data, visit.id]);

  const updateEar = (ear: 'rt' | 'lt' | 'free_field' | 'free_field_rt' | 'free_field_lt', field: keyof EarTestValue, val: string) => {
    const nums = val.split(/[,\s]+/).map(v => parseInt(v.trim())).filter(n => !isNaN(n));
    setData(prev => ({ ...prev, [ear]: { ...prev[ear], [field]: nums } }));
    onDirtyChange(true);
  };

  const InputCol = ({ label, ear, field, color, unit }: { label: string, ear: 'rt' | 'lt' | 'free_field' | 'free_field_rt' | 'free_field_lt', field: keyof EarTestValue, color: string, unit: string }) => {
    const values = data[ear][field] || [];
    const formattedValue = values.map(v => `${v}${unit}`).join(', ');
    const [localValue, setLocalValue] = useState(formattedValue);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) {
        setLocalValue(formattedValue);
      }
    }, [formattedValue, isFocused]);

    const handleChange = (val: string) => {
      const cleaned = val.replace(/[^0-9,\s]/g, '');
      setLocalValue(cleaned);
      onDirtyChange(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      const cleanedNums = localValue.split(/[,\s]+/).map(v => parseInt(v.trim())).filter(n => !isNaN(n));
      setLocalValue(cleanedNums.map(v => `${v}${unit}`).join(', '));
      setData(prev => ({ ...prev, [ear]: { ...prev[ear], [field]: cleanedNums } }));
    };

    const handleFocus = () => {
      setIsFocused(true);
      const cleanedNums = localValue.split(/[,\s]+/).map(v => parseInt(v.trim())).filter(n => !isNaN(n));
      setLocalValue(cleanedNums.join(', '));
    };

    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <input 
          type="text" 
          className={`w-full p-4 text-center font-black border-2 rounded-2xl transition-all focus:ring-4 ${color}`} 
          value={localValue} 
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={e => handleChange(e.target.value)} 
          placeholder="-" 
        />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      <div className="flex justify-between items-center border-b-4 border-purple-600 pb-4">
        <div className="flex items-center gap-4">
          <Headphones className="w-8 h-8 text-purple-600" />
          <h3 className="text-3xl font-black text-purple-900 tracking-tight">어음검사 정밀 기록</h3>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-400">※ 여러 수치 입력 시 쉼표(,)나 공백으로 구분</div>
          <div className="text-[10px] text-purple-500 font-bold">기입 완료 시 자동으로 단위가 표시됩니다.</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-red-50/30 p-8 rounded-[2rem] border border-red-100 space-y-6" data-capture="speech-right">
          <h4 className="text-red-700 font-black text-xl border-b-2 border-red-200 pb-2">Rt (우측)</h4>
          <InputCol label="SRS" ear="rt" field="srt" color="bg-white border-red-100 focus:ring-red-100" unit="dB" />
          <InputCol label="WRS" ear="rt" field="wrs_percent" color="bg-white border-red-100 focus:ring-red-100" unit="%" />
          <InputCol label="MCL" ear="rt" field="mcl" color="bg-white border-red-100 focus:ring-red-100" unit="dB" />
          <InputCol label="UCL" ear="rt" field="ucl" color="bg-white border-red-100 focus:ring-red-100" unit="dB" />
        </div>
        <div className="bg-blue-50/30 p-8 rounded-[2rem] border border-blue-100 space-y-6" data-capture="speech-left">
          <h4 className="text-blue-700 font-black text-xl border-b-2 border-blue-200 pb-2">Lt (좌측)</h4>
          <InputCol label="SRS" ear="lt" field="srt" color="bg-white border-blue-100 focus:ring-blue-100" unit="dB" />
          <InputCol label="WRS" ear="lt" field="wrs_percent" color="bg-white border-blue-100 focus:ring-blue-100" unit="%" />
          <InputCol label="MCL" ear="lt" field="mcl" color="bg-white border-blue-100 focus:ring-blue-100" unit="dB" />
          <InputCol label="UCL" ear="lt" field="ucl" color="bg-white border-blue-100 focus:ring-blue-100" unit="dB" />
        </div>
      </div>

      <div className="border-t-4 border-emerald-600 pt-8 mt-8" data-capture="speech-freefield">
        <h3 className="text-2xl font-black text-emerald-900 mb-6">Free Field (음장검사)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-red-50/30 p-8 rounded-[2rem] border border-red-100 space-y-6">
            <h4 className="text-red-700 font-black text-xl border-b-2 border-red-200 pb-2">Rt (우측)</h4>
            <InputCol label="SRS" ear="free_field_rt" field="srt" color="bg-white border-red-100 focus:ring-red-100" unit="dB" />
            <InputCol label="WRS" ear="free_field_rt" field="wrs_percent" color="bg-white border-red-100 focus:ring-red-100" unit="%" />
            <InputCol label="MCL" ear="free_field_rt" field="mcl" color="bg-white border-red-100 focus:ring-red-100" unit="dB" />
            <InputCol label="UCL" ear="free_field_rt" field="ucl" color="bg-white border-red-100 focus:ring-red-100" unit="dB" />
          </div>
          <div className="bg-blue-50/30 p-8 rounded-[2rem] border border-blue-100 space-y-6">
            <h4 className="text-blue-700 font-black text-xl border-b-2 border-blue-200 pb-2">Lt (좌측)</h4>
            <InputCol label="SRS" ear="free_field_lt" field="srt" color="bg-white border-blue-100 focus:ring-blue-100" unit="dB" />
            <InputCol label="WRS" ear="free_field_lt" field="wrs_percent" color="bg-white border-blue-100 focus:ring-blue-100" unit="%" />
            <InputCol label="MCL" ear="free_field_lt" field="mcl" color="bg-white border-blue-100 focus:ring-blue-100" unit="dB" />
            <InputCol label="UCL" ear="free_field_lt" field="ucl" color="bg-white border-blue-100 focus:ring-blue-100" unit="dB" />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <label className="text-xs font-black text-slate-400 uppercase mb-2 block tracking-widest">검사 메모</label>
        <textarea className="w-full p-4 bg-slate-50 border rounded-xl min-h-[100px] outline-none" value={data.special_notes || ''} onChange={e => { setData({...data, special_notes: e.target.value}); onDirtyChange(true); }} placeholder="검사 당시 컨디션이나 특이사항..." />
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={handleSave} className="bg-purple-600 text-white px-28 py-6 rounded-3xl font-black text-2xl shadow-xl hover:scale-105 transition-all">최종 저장 및 프로토콜 연동</button>
      </div>
    </div>
  );
};

export default SpeechTestForm;
