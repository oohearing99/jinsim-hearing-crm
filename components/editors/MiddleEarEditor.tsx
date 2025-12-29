
import React from 'react';
import { DetailedMiddleEar, OtoscopyChecklist } from '../../types';
import { suggestTympType } from '../../utils/hearingUtils';
import { Eye, Activity, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface Props {
  data: DetailedMiddleEar;
  onChange: (data: DetailedMiddleEar) => void;
}

// 체크리스트 항목 정의
const OTOSCOPY_CHECKLIST_ITEMS: { key: keyof OtoscopyChecklist; label: string; category: 'ear_canal' | 'tympanic' }[] = [
  // 외이도(External Ear Canal) 관련
  { key: 'earwax', label: '이구(귀지) 상태 확인', category: 'ear_canal' },
  { key: 'inflammation', label: '외이도 염증/발적 여부', category: 'ear_canal' },
  { key: 'stenosis', label: '외이도 협착 여부', category: 'ear_canal' },
  { key: 'discharge', label: '분비물 유무', category: 'ear_canal' },
  // 고막(Tympanic Membrane) 관련
  { key: 'perforation', label: '고막 천공 여부', category: 'tympanic' },
  { key: 'discoloration', label: '고막 색상 이상 (발적/혼탁)', category: 'tympanic' },
  { key: 'effusion', label: '삼출액 저류 소견', category: 'tympanic' },
  { key: 'lightReflex', label: '고막 반사(Light reflex) 정상', category: 'tympanic' },
];

const DEFAULT_CHECKLIST: OtoscopyChecklist = {
  earwax: null,
  inflammation: null,
  stenosis: null,
  discharge: null,
  perforation: null,
  discoloration: null,
  effusion: null,
  lightReflex: null,
};

const MiddleEarEditor: React.FC<Props> = ({ data, onChange }) => {
  // 체크리스트 항목 업데이트 함수
  const updateChecklist = (side: 'right' | 'left', key: keyof OtoscopyChecklist, value: boolean | null) => {
    const checklistKey = side === 'right' ? 'checklistRight' : 'checklistLeft';
    const currentChecklist = data.otoscopy[checklistKey] || { ...DEFAULT_CHECKLIST };
    onChange({
      ...data,
      otoscopy: {
        ...data.otoscopy,
        [checklistKey]: {
          ...currentChecklist,
          [key]: value,
        },
      },
    });
  };

  // 체크리스트 상태 순환 (null -> true -> false -> null)
  const cycleChecklistValue = (currentValue: boolean | null): boolean | null => {
    if (currentValue === null) return true;
    if (currentValue === true) return false;
    return null;
  };

  const updateTymp = (side: 'right' | 'left', field: string, val: string) => {
    const num = val === '' ? null : parseFloat(val);
    const newData = { ...data };
    (newData.tympanometry[side] as any)[field] = num;
    
    // Auto suggest type
    if (field === 'peak_pressure_daPa' || field === 'compliance_ml') {
      newData.tympanometry[side].type = suggestTympType(
        newData.tympanometry[side].peak_pressure_daPa,
        newData.tympanometry[side].compliance_ml
      ) as any;
    }
    onChange(newData);
  };

  const renderTympFields = (side: 'right' | 'left') => (
    <div className={`p-4 rounded-xl border ${side === 'right' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'} space-y-4`}>
      <h6 className={`font-black text-xs uppercase tracking-widest ${side === 'right' ? 'text-red-600' : 'text-blue-600'}`}>
        Tympanometry {side === 'right' ? 'Rt' : 'Lt'}
      </h6>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-400">Peak Pressure (daPa)</label>
          <input 
            type="number"
            className="w-full p-2 rounded border border-white bg-white/60 font-bold"
            value={data.tympanometry[side].peak_pressure_daPa ?? ''}
            onChange={e => updateTymp(side, 'peak_pressure_daPa', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400">Compliance (ml)</label>
          <input 
            type="number"
            step="0.1"
            className="w-full p-2 rounded border border-white bg-white/60 font-bold"
            value={data.tympanometry[side].compliance_ml ?? ''}
            onChange={e => updateTymp(side, 'compliance_ml', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400">ECV (ml)</label>
          <input 
            type="number"
            step="0.1"
            className="w-full p-2 rounded border border-white bg-white/60 font-bold"
            value={data.tympanometry[side].ecv_ml ?? ''}
            onChange={e => updateTymp(side, 'ecv_ml', e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400">Type</label>
          <select 
            className="w-full p-2 rounded border border-white bg-white/60 font-bold"
            value={data.tympanometry[side].type || 'UNKNOWN'}
            onChange={e => {
              const newData = { ...data };
              newData.tympanometry[side].type = e.target.value as any;
              onChange(newData);
            }}
          >
            <option value="A">A</option>
            <option value="As">As</option>
            <option value="Ad">Ad</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="UNKNOWN">?</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><Eye className="w-5 h-5 text-teal-500" /><h5 className="font-bold text-slate-700">중이검사 (Otoscopy/Tymp)</h5></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderTympFields('right')}
        {renderTympFields('left')}
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        <label className="text-xs font-bold text-slate-500">이경검사 (Otoscopy) 체크리스트</label>

        {/* 체크리스트 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 오른쪽 귀 체크리스트 */}
          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <h6 className="font-black text-xs uppercase tracking-widest text-red-600 mb-3">Rt (오른쪽)</h6>

            {/* 외이도 관련 */}
            <div className="mb-3">
              <div className="text-[10px] font-bold text-slate-400 mb-2">외이도(External Ear Canal)</div>
              <div className="space-y-1.5">
                {OTOSCOPY_CHECKLIST_ITEMS.filter(item => item.category === 'ear_canal').map(item => {
                  const checklist = data.otoscopy.checklistRight || DEFAULT_CHECKLIST;
                  const value = checklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateChecklist('right', item.key, cycleChecklistValue(value))}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                        value === true
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : value === false
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {value === true ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : value === false ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 고막 관련 */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 mb-2">고막(Tympanic Membrane)</div>
              <div className="space-y-1.5">
                {OTOSCOPY_CHECKLIST_ITEMS.filter(item => item.category === 'tympanic').map(item => {
                  const checklist = data.otoscopy.checklistRight || DEFAULT_CHECKLIST;
                  const value = checklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateChecklist('right', item.key, cycleChecklistValue(value))}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                        value === true
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : value === false
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {value === true ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : value === false ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 왼쪽 귀 체크리스트 */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h6 className="font-black text-xs uppercase tracking-widest text-blue-600 mb-3">Lt (왼쪽)</h6>

            {/* 외이도 관련 */}
            <div className="mb-3">
              <div className="text-[10px] font-bold text-slate-400 mb-2">외이도(External Ear Canal)</div>
              <div className="space-y-1.5">
                {OTOSCOPY_CHECKLIST_ITEMS.filter(item => item.category === 'ear_canal').map(item => {
                  const checklist = data.otoscopy.checklistLeft || DEFAULT_CHECKLIST;
                  const value = checklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateChecklist('left', item.key, cycleChecklistValue(value))}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                        value === true
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : value === false
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {value === true ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : value === false ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 고막 관련 */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 mb-2">고막(Tympanic Membrane)</div>
              <div className="space-y-1.5">
                {OTOSCOPY_CHECKLIST_ITEMS.filter(item => item.category === 'tympanic').map(item => {
                  const checklist = data.otoscopy.checklistLeft || DEFAULT_CHECKLIST;
                  const value = checklist[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateChecklist('left', item.key, cycleChecklistValue(value))}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                        value === true
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : value === false
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {value === true ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : value === false ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                      )}
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
          <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
          <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
        </div>

        {/* 추가 메모 입력 */}
        <div className="pt-2">
          <label className="text-[10px] font-bold text-slate-400 mb-2 block">추가 메모</label>
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Rt 이경 추가 소견"
              className="p-2 text-xs border rounded bg-white"
              value={data.otoscopy.right || ''}
              onChange={e => onChange({...data, otoscopy: {...data.otoscopy, right: e.target.value}})}
            />
            <input
              placeholder="Lt 이경 추가 소견"
              className="p-2 text-xs border rounded bg-white"
              value={data.otoscopy.left || ''}
              onChange={e => onChange({...data, otoscopy: {...data.otoscopy, left: e.target.value}})}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiddleEarEditor;
