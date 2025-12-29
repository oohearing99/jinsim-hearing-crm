
import React from 'react';

interface Props {
  data: { 
    right: Record<string, number | null>; 
    left: Record<string, number | null>; 
  };
  onChange: (newData: { right: Record<string, number | null>; left: Record<string, number | null> }) => void;
}

const FREQS = ["250", "500", "1000", "2000", "4000"];

const SoundFieldEditor: React.FC<Props> = ({ data, onChange }) => {
  const handleUpdate = (ear: 'right' | 'left', freq: string, val: string) => {
    const num = val === '' ? null : parseInt(val);
    const newData = {
      ...data,
      [ear]: { ...data[ear], [freq]: num }
    };
    onChange(newData);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, ear: 'right' | 'left', freqIndex: number) => {
    const nextEar = ear === 'right' ? 'left' : 'right';
    
    switch (e.key) {
      case 'ArrowRight':
        if (freqIndex < FREQS.length - 1) {
          document.getElementById(`sf-${ear}-${FREQS[freqIndex + 1]}`)?.focus();
        }
        break;
      case 'ArrowLeft':
        if (freqIndex > 0) {
          document.getElementById(`sf-${ear}-${FREQS[freqIndex - 1]}`)?.focus();
        }
        break;
      case 'ArrowDown':
        if (ear === 'right') {
          document.getElementById(`sf-left-${FREQS[freqIndex]}`)?.focus();
        }
        break;
      case 'ArrowUp':
        if (ear === 'left') {
          document.getElementById(`sf-right-${FREQS[freqIndex]}`)?.focus();
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-center text-[10px]">
        <thead className="bg-slate-100 border-b border-slate-200">
          <tr>
            <th className="p-2 border-r font-bold text-slate-400 w-24">구분</th>
            {FREQS.map(f => <th key={f} className="p-2 border-r font-bold">{f} Hz</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2 font-black text-red-600 bg-red-50/30 border-r">Aided Rt (○)</td>
            {FREQS.map((f, idx) => (
              <td key={f} className="p-0 border-r">
                <input 
                  id={`sf-right-${f}`}
                  type="number"
                  className="w-full p-2 text-center bg-transparent font-bold outline-none focus:bg-orange-50 transition-colors"
                  value={data.right[f] ?? ''}
                  onChange={e => handleUpdate('right', f, e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 'right', idx)}
                  placeholder="-"
                />
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-2 font-black text-blue-600 bg-blue-50/30 border-r">Aided Lt (×)</td>
            {FREQS.map((f, idx) => (
              <td key={f} className="p-0 border-r">
                <input 
                  id={`sf-left-${f}`}
                  type="number"
                  className="w-full p-2 text-center bg-transparent font-bold outline-none focus:bg-orange-50 transition-colors"
                  value={data.left[f] ?? ''}
                  onChange={e => handleUpdate('left', f, e.target.value)}
                  onKeyDown={e => handleKeyDown(e, 'left', idx)}
                  placeholder="-"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="p-2 bg-slate-50 text-[9px] text-slate-400 font-bold flex gap-4">
        <span>※ 방향키(↑↓←→)를 사용하여 칸 사이를 빠르게 이동할 수 있습니다.</span>
      </div>
    </div>
  );
};

export default SoundFieldEditor;
