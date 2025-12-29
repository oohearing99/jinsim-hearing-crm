
import React from 'react';
import { DetailedVerification } from '../../types';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  data: DetailedVerification;
  onChange: (data: DetailedVerification) => void;
}

const VerificationEditor: React.FC<Props> = ({ data, onChange }) => {
  const updateRem = (field: string, val: any) => {
    const newData = { ...data, rem: { ...data.rem, [field]: val } };
    onChange(newData);
  };

  const updateEaa = (field: string, val: any) => {
    const newData = { ...data, eaa: { ...data.eaa, [field]: val } };
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /><h5 className="font-bold text-slate-700">검증 및 점검 (REM/EAA)</h5></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REM Section */}
        <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
          <h6 className="font-black text-[10px] text-emerald-600 uppercase tracking-widest">REM (실이측정)</h6>
          <div className="space-y-3">
             <div>
               <label className="text-[10px] font-bold text-slate-400">처방 공식</label>
               <select 
                 className="w-full p-2 rounded border bg-white text-xs font-bold"
                 value={data.rem.formula || ''}
                 onChange={e => updateRem('formula', e.target.value)}
               >
                 <option value="">선택 안함</option>
                 <option value="NAL-NL2">NAL-NL2</option>
                 <option value="DSLv5">DSL v5.0</option>
                 <option value="OTHER">Other</option>
               </select>
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400">목표 부합 여부</label>
               <div className="flex gap-2">
                 {['PASS', 'PARTIAL', 'FAIL'].map(m => (
                   <button 
                    key={m}
                    onClick={() => updateRem('target_match', m)}
                    className={`flex-1 py-1.5 rounded text-[10px] font-black border transition-all ${data.rem.target_match === m ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'}`}
                   >
                     {m}
                   </button>
                 ))}
               </div>
             </div>
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-emerald-600"
                  checked={data.rem.mpo_safe}
                  onChange={e => updateRem('mpo_safe', e.target.checked)}
                />
                <span className="text-xs font-bold text-slate-600">MPO 안전 확인됨</span>
             </label>
          </div>
        </div>

        {/* EAA Section */}
        <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
          <h6 className="font-black text-[10px] text-slate-400 uppercase tracking-widest">EAA (기기 성능 분석)</h6>
          <div className="space-y-3">
             <div className="flex gap-2">
                <button 
                  onClick={() => updateEaa('pass', true)}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs border ${data.eaa.pass === true ? 'bg-blue-600 text-white' : 'bg-white'}`}
                >
                  PASS
                </button>
                <button 
                  onClick={() => updateEaa('pass', false)}
                  className={`flex-1 py-2 rounded-xl font-bold text-xs border ${data.eaa.pass === false ? 'bg-red-600 text-white' : 'bg-white'}`}
                >
                  FAIL
                </button>
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-400">OSPL90 Peak (dB)</label>
                <input 
                  type="number"
                  className="w-full p-2 rounded border bg-white font-bold"
                  value={data.eaa.ospl90_db ?? ''}
                  onChange={e => updateEaa('ospl90_db', parseInt(e.target.value))}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationEditor;
