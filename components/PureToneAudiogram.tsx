
import React, { useState, useMemo, useEffect } from 'react';
import { Visit, Customer, PureToneTestData, DetailedPureTone } from '../types';
import { FREQUENCIES, BRAND_ID } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Save, Activity, Keyboard, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculatePTA6, checkDisabilityEligibility } from '../utils/hearingUtils';

interface Props {
  visit: Visit;
  customer: Customer;
  onSave: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  saveTriggerRef: React.MutableRefObject<() => void>;
}

const RenderCustomO = (props: any) => {
  const { cx, cy, stroke, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  // NR인 경우 아래 화살표 표시
  if (payload?.isNR_rt_ac) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M 0,-8 L -5,0 L 0,3 L 5,0 Z" fill={stroke} stroke={stroke} strokeWidth={1} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={6} stroke={stroke} strokeWidth={2} fill="none" />;
};

const RenderCustomX = (props: any) => {
  const { cx, cy, stroke, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  const size = 5;
  // NR인 경우 아래 화살표 표시
  if (payload?.isNR_lt_ac) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M 0,-8 L -5,0 L 0,3 L 5,0 Z" fill={stroke} stroke={stroke} strokeWidth={1} />
      </g>
    );
  }
  return (
    <g transform={`translate(${cx},${cy})`}>
      <line x1={-size} y1={-size} x2={size} y2={size} stroke={stroke} strokeWidth={2} />
      <line x1={-size} y1={size} x2={size} y2={-size} stroke={stroke} strokeWidth={2} />
    </g>
  );
};

const RenderCustomA = (props: any) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  if (cx === undefined || cy === undefined) return null;
  // NR 체크 (rt_sf 또는 lt_sf에 따라)
  const isNR = dataKey === 'rt_sf' ? payload?.isNR_rt_sf : payload?.isNR_lt_sf;
  if (isNR) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M 0,-8 L -5,0 L 0,3 L 5,0 Z" fill={stroke} stroke={stroke} strokeWidth={1} />
      </g>
    );
  }
  return (
    <g transform={`translate(${cx},${cy})`}>
      <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="black" fill={stroke}>A</text>
    </g>
  );
};

const RenderCustomBC = (props: any) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  if (cx === undefined || cy === undefined) return null;
  // NR 체크 (rt_bc 또는 lt_bc에 따라)
  const isNR = dataKey === 'rt_bc' ? payload?.isNR_rt_bc : payload?.isNR_lt_bc;
  if (isNR) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M 0,-8 L -5,0 L 0,3 L 5,0 Z" fill={stroke} stroke={stroke} strokeWidth={1} />
      </g>
    );
  }
  // 골도 기호: < 또는 >
  const symbol = dataKey === 'rt_bc' ? '<' : '>';
  return (
    <g transform={`translate(${cx},${cy})`}>
      <text x="0" y="4" textAnchor="middle" fontSize="16" fontWeight="black" fill={stroke}>{symbol}</text>
    </g>
  );
};

const PureToneAudiogram: React.FC<Props> = ({ visit, customer, onSave, onDirtyChange, saveTriggerRef }) => {
  const prefCounselor = localStorage.getItem('jinsim_pref_counselor') || 'Admin';
  const prefCenter = localStorage.getItem('jinsim_pref_center') || 'SEOUL_MAIN';

  const [data, setData] = useState<PureToneTestData>(() => {
    const haSaved = localStorage.getItem(`hasession_${visit.id}`);
    const ptaSaved = localStorage.getItem(`pta_${visit.id}`);

    let initialFreqs: any = {};
    FREQUENCIES.forEach(f => { initialFreqs[f] = {}; });

    // HA 프로토콜 데이터를 우선적으로 가져옴
    if (haSaved) {
      const ha = JSON.parse(haSaved);
      const pt = ha.results_detailed?.pure_tone as DetailedPureTone;
      if (pt) {
        FREQUENCIES.forEach(f => {
          initialFreqs[f] = {
            rt_ac: pt.ac_dbhl?.right?.[f] ?? null,
            lt_ac: pt.ac_dbhl?.left?.[f] ?? null,
            rt_bc: pt.bc_dbhl?.right?.[f] ?? null,
            lt_bc: pt.bc_dbhl?.left?.[f] ?? null,
            rt_sf: pt.sf_dbhl?.right?.[f] ?? null,
            lt_sf: pt.sf_dbhl?.left?.[f] ?? null,
            // NR 플래그
            rt_ac_nr: pt.nr?.right?.includes(f) ?? false,
            lt_ac_nr: pt.nr?.left?.includes(f) ?? false,
            rt_bc_nr: pt.nr?.right?.includes(f) ?? false,
            lt_bc_nr: pt.nr?.left?.includes(f) ?? false,
            rt_sf_nr: pt.nr?.sf_right?.includes(f) ?? false,
            lt_sf_nr: pt.nr?.sf_left?.includes(f) ?? false,
          };
        });
      }
    } else if (ptaSaved) {
      try {
        const parsedData = JSON.parse(ptaSaved);
        // 데이터 구조 검증 및 복구
        if (parsedData.frequencies) {
          // 모든 주파수에 대해 객체가 존재하는지 확인하고 없으면 빈 객체로 초기화
          FREQUENCIES.forEach(f => {
            if (!parsedData.frequencies[f] || typeof parsedData.frequencies[f] !== 'object') {
              parsedData.frequencies[f] = {};
            }
          });
        } else {
          // frequencies 속성이 아예 없으면 초기화
          parsedData.frequencies = initialFreqs;
        }
        return parsedData;
      } catch (error) {
        // JSON 파싱 실패 시 초기 데이터로 복구
        console.warn('순음검사 데이터 복구 중:', error);
        localStorage.removeItem(`pta_${visit.id}`);
      }
    }

    return {
      visit_id: visit.id,
      customer_id: customer.id,
      frequencies: initialFreqs,
      brand_id: BRAND_ID,
      center_id: prefCenter,
      counselor_name: prefCounselor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  const chartData = useMemo(() => {
    return FREQUENCIES.map(f => ({
      frequency: f,
      rt_ac: data.frequencies[f]?.rt_ac_nr ? 120 : data.frequencies[f]?.rt_ac,
      lt_ac: data.frequencies[f]?.lt_ac_nr ? 120 : data.frequencies[f]?.lt_ac,
      rt_bc: data.frequencies[f]?.rt_bc_nr ? 120 : data.frequencies[f]?.rt_bc,
      lt_bc: data.frequencies[f]?.lt_bc_nr ? 120 : data.frequencies[f]?.lt_bc,
      rt_sf: data.frequencies[f]?.rt_sf_nr ? 120 : data.frequencies[f]?.rt_sf,
      lt_sf: data.frequencies[f]?.lt_sf_nr ? 120 : data.frequencies[f]?.lt_sf,
      // NR 플래그
      isNR_rt_ac: data.frequencies[f]?.rt_ac_nr,
      isNR_lt_ac: data.frequencies[f]?.lt_ac_nr,
      isNR_rt_bc: data.frequencies[f]?.rt_bc_nr,
      isNR_lt_bc: data.frequencies[f]?.lt_bc_nr,
      isNR_rt_sf: data.frequencies[f]?.rt_sf_nr,
      isNR_lt_sf: data.frequencies[f]?.lt_sf_nr,
    }));
  }, [data]);

  const pta6Analysis = useMemo(() => {
    const rightThresholds: Record<string, number | null> = {};
    const leftThresholds: Record<string, number | null> = {};

    FREQUENCIES.forEach(f => {
      rightThresholds[f] = data.frequencies[f]?.rt_ac ?? null;
      leftThresholds[f] = data.frequencies[f]?.lt_ac ?? null;
    });

    const pta6Right = calculatePTA6(rightThresholds);
    const pta6Left = calculatePTA6(leftThresholds);

    // 어음명료도(WRS) 데이터 가져오기
    let wrsRight: number | null = null;
    let wrsLeft: number | null = null;

    const speechSaved = localStorage.getItem(`speech_${visit.id}`);
    if (speechSaved) {
      const speechData = JSON.parse(speechSaved);
      wrsRight = speechData.wrs_rt ?? null;
      wrsLeft = speechData.wrs_lt ?? null;
    }

    const eligibility = checkDisabilityEligibility(pta6Right, pta6Left, wrsRight, wrsLeft);

    return { pta6Right, pta6Left, wrsRight, wrsLeft, eligibility };
  }, [data, visit.id]);

  const handleUpdate = (freq: string, field: string, val: string) => {
    const num = val === '' ? undefined : parseInt(val);
    setData(prev => ({
      ...prev,
      frequencies: {
        ...prev.frequencies,
        [freq]: { ...(prev.frequencies[freq] || {}), [field]: num }
      }
    }));
    onDirtyChange(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, freq: string, field: string) => {
    const freqIdx = FREQUENCIES.indexOf(freq);
    const fields = ['rt_ac', 'lt_ac', 'rt_sf', 'lt_sf', 'rt_bc', 'lt_bc'];
    const fieldIdx = fields.indexOf(field);

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault(); // 화살표 키만 기본 동작 방지
        if (freqIdx < FREQUENCIES.length - 1) document.getElementById(`pta-in-${FREQUENCIES[freqIdx + 1]}-${field}`)?.focus();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (freqIdx > 0) document.getElementById(`pta-in-${FREQUENCIES[freqIdx - 1]}-${field}`)?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (fieldIdx < fields.length - 1) document.getElementById(`pta-in-${freq}-${fields[fieldIdx + 1]}`)?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (fieldIdx > 0) document.getElementById(`pta-in-${freq}-${fields[fieldIdx - 1]}`)?.focus();
        break;
    }
  };

  const handleSave = () => {
    const finalData = { ...data, updated_at: new Date().toISOString() };
    localStorage.setItem(`pta_${visit.id}`, JSON.stringify(finalData));
    
    const haSaved = localStorage.getItem(`hasession_${visit.id}`);
    if (haSaved) {
      const ha = JSON.parse(haSaved);
      if (!ha.results_detailed) ha.results_detailed = {};
      if (!ha.results_detailed.pure_tone) ha.results_detailed.pure_tone = { ac_dbhl: { right: {}, left: {} }, bc_dbhl: { right: {}, left: {} }, sf_dbhl: { right: {}, left: {} }, nr: { right: [], left: [], sf_right: [], sf_left: [] }, derived: {} };
      
      const pt = ha.results_detailed.pure_tone;
      FREQUENCIES.forEach(f => {
        pt.ac_dbhl.right[f] = data.frequencies[f]?.rt_ac;
        pt.ac_dbhl.left[f] = data.frequencies[f]?.lt_ac;
        if (!pt.sf_dbhl) pt.sf_dbhl = { right: {}, left: {} };
        pt.sf_dbhl.right[f] = data.frequencies[f]?.rt_sf;
        pt.sf_dbhl.left[f] = data.frequencies[f]?.lt_sf;
      });
      localStorage.setItem(`hasession_${visit.id}`, JSON.stringify(ha));
    }
    onDirtyChange(false);
    onSave();
  };

  useEffect(() => {
    saveTriggerRef.current = handleSave;
  }, [data]);

  // 데이터 변경 시 자동 저장 (탭 이동 시에도 데이터 유지)
  useEffect(() => {
    const finalData = { ...data, updated_at: new Date().toISOString() };
    localStorage.setItem(`pta_${visit.id}`, JSON.stringify(finalData));

    // HA 세션에도 동기화
    const haSaved = localStorage.getItem(`hasession_${visit.id}`);
    if (haSaved) {
      const ha = JSON.parse(haSaved);
      if (!ha.results_detailed) ha.results_detailed = {};
      if (!ha.results_detailed.pure_tone) ha.results_detailed.pure_tone = { ac_dbhl: { right: {}, left: {} }, bc_dbhl: { right: {}, left: {} }, sf_dbhl: { right: {}, left: {} }, nr: { right: [], left: [], sf_right: [], sf_left: [] }, derived: {} };

      const pt = ha.results_detailed.pure_tone;
      FREQUENCIES.forEach(f => {
        pt.ac_dbhl.right[f] = data.frequencies[f]?.rt_ac;
        pt.ac_dbhl.left[f] = data.frequencies[f]?.lt_ac;
        if (!pt.sf_dbhl) pt.sf_dbhl = { right: {}, left: {} };
        pt.sf_dbhl.right[f] = data.frequencies[f]?.rt_sf;
        pt.sf_dbhl.left[f] = data.frequencies[f]?.lt_sf;
      });
      localStorage.setItem(`hasession_${visit.id}`, JSON.stringify(ha));
    }
  }, [data, visit.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16">
      <div className="flex justify-between items-center border-b-4 border-orange-600 pb-4">
        <div className="flex items-center gap-4">
           <Activity className="w-8 h-8 text-orange-600" />
           <h3 className="text-3xl font-black text-orange-900 tracking-tight">순음청력검사 결과</h3>
        </div>
        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-5 py-2.5 rounded-2xl border border-orange-100 shadow-sm">
          <Keyboard className="w-5 h-5" />
          <span className="text-sm font-black">방향키 및 5단위 입력 지원</span>
        </div>
      </div>

      {/* 순음검사 청력도 */}
      <div data-capture="pure-tone-audiogram" className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl">
        <div className="w-full" style={{ height: '600px', minHeight: '600px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 30, right: 40, left: 30, bottom: 50 }}>
              <CartesianGrid strokeDasharray="1 1" stroke="#f1f5f9" />
              <XAxis dataKey="frequency" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis reversed domain={[-10, 120]} ticks={[0, 20, 40, 60, 80, 100, 120]} tick={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={40} />
              <Line type="monotone" dataKey="rt_ac" stroke="#ef4444" name="Rt AC (○)" strokeWidth={3} dot={<RenderCustomO stroke="#ef4444" />} connectNulls />
              <Line type="monotone" dataKey="lt_ac" stroke="#3b82f6" name="Lt AC (×)" strokeWidth={3} dot={<RenderCustomX stroke="#3b82f6" />} connectNulls />
              <Line type="monotone" dataKey="rt_bc" stroke="#dc2626" name="Rt BC (<)" strokeWidth={2} dot={<RenderCustomBC stroke="#dc2626" />} connectNulls strokeDasharray="3 3" />
              <Line type="monotone" dataKey="lt_bc" stroke="#2563eb" name="Lt BC (>)" strokeWidth={2} dot={<RenderCustomBC stroke="#2563eb" />} connectNulls strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rt_sf" stroke="#ef4444" name="Rt SF (A)" strokeWidth={3} dot={<RenderCustomA stroke="#ef4444" />} connectNulls />
              <Line type="monotone" dataKey="lt_sf" stroke="#3b82f6" name="Lt SF (A)" strokeWidth={3} dot={<RenderCustomA stroke="#3b82f6" />} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 순음검사 PTA-6 분석 */}
      <div data-capture="pure-tone-pta6" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-[2rem] border-2 border-red-200 shadow-lg">
          <div className="text-sm font-black text-red-600 mb-2">우측 6분법 (PTA-6)</div>
          <div className="text-5xl font-black text-red-700">
            {pta6Analysis.pta6Right !== null ? `${pta6Analysis.pta6Right.toFixed(1)}` : '—'}
            {pta6Analysis.pta6Right !== null && <span className="text-2xl ml-2">dB HL</span>}
          </div>
          <div className="text-xs text-red-500 mt-3 font-bold">500×1 + 1000×2 + 2000×2 + 4000×1 / 6</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-[2rem] border-2 border-blue-200 shadow-lg">
          <div className="text-sm font-black text-blue-600 mb-2">좌측 6분법 (PTA-6)</div>
          <div className="text-5xl font-black text-blue-700">
            {pta6Analysis.pta6Left !== null ? `${pta6Analysis.pta6Left.toFixed(1)}` : '—'}
            {pta6Analysis.pta6Left !== null && <span className="text-2xl ml-2">dB HL</span>}
          </div>
          <div className="text-xs text-blue-500 mt-3 font-bold">500×1 + 1000×2 + 2000×2 + 4000×1 / 6</div>
        </div>

        <div className={`bg-gradient-to-br ${pta6Analysis.eligibility.eligible ? 'from-green-50 to-green-100 border-green-200' : 'from-amber-50 to-amber-100 border-amber-200'} p-8 rounded-[2rem] border-2 shadow-lg`}>
          <div className={`text-sm font-black ${pta6Analysis.eligibility.eligible ? 'text-green-600' : 'text-amber-600'} mb-2`}>청각장애 진단</div>
          <div className="flex items-center gap-3 mb-2">
            {pta6Analysis.eligibility.eligible ? (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            ) : (
              <AlertCircle className="w-10 h-10 text-amber-600" />
            )}
            <div className={`text-3xl font-black ${pta6Analysis.eligibility.eligible ? 'text-green-700' : 'text-amber-700'}`}>
              {pta6Analysis.eligibility.eligible ? '가능' : '불가'}
            </div>
          </div>
          <div className={`text-sm ${pta6Analysis.eligibility.eligible ? 'text-green-600' : 'text-amber-600'} font-bold`}>
            {pta6Analysis.eligibility.reason}
          </div>
        </div>
      </div>

      {/* 순음검사 데이터 테이블 */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-lg overflow-x-auto" data-capture="pure-tone-table">
        <table className="w-full text-center">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-4 border-r border-slate-700 font-black w-28">Hz</th>
              {FREQUENCIES.map(f => <th key={f} className="p-4 border-r border-slate-700 font-black text-slate-300">{f}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-4 bg-red-50 text-red-700 font-black border-r">우측 기도 (AC)</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="p-0 border-r min-w-[80px]">
                  <input id={`pta-in-${f}-rt_ac`} type="number" step="5" className="w-full p-4 text-center font-black outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={data.frequencies[f]?.rt_ac ?? ''} onChange={e => handleUpdate(f, 'rt_ac', e.target.value)} onKeyDown={e => handleKeyDown(e, f, 'rt_ac')} onFocus={e => e.target.select()} />
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 bg-blue-50 text-blue-700 font-black border-r">좌측 기도 (AC)</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="p-0 border-r min-w-[80px]">
                  <input id={`pta-in-${f}-lt_ac`} type="number" step="5" className="w-full p-4 text-center font-black outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={data.frequencies[f]?.lt_ac ?? ''} onChange={e => handleUpdate(f, 'lt_ac', e.target.value)} onKeyDown={e => handleKeyDown(e, f, 'lt_ac')} onFocus={e => e.target.select()} />
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 bg-red-100/50 text-red-800 font-black border-r">우측 음장 (SF)</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="p-0 border-r min-w-[80px]">
                  <input id={`pta-in-${f}-rt_sf`} type="number" step="5" className="w-full p-4 text-center font-black outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={data.frequencies[f]?.rt_sf ?? ''} onChange={e => handleUpdate(f, 'rt_sf', e.target.value)} onKeyDown={e => handleKeyDown(e, f, 'rt_sf')} onFocus={e => e.target.select()} />
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 bg-blue-100/50 text-blue-800 font-black border-r">좌측 음장 (SF)</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="p-0 border-r min-w-[80px]">
                  <input id={`pta-in-${f}-lt_sf`} type="number" step="5" className="w-full p-4 text-center font-black outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={data.frequencies[f]?.lt_sf ?? ''} onChange={e => handleUpdate(f, 'lt_sf', e.target.value)} onKeyDown={e => handleKeyDown(e, f, 'lt_sf')} onFocus={e => e.target.select()} />
                </td>
              ))}
            </tr>
            <tr className="border-b">
              <td className="p-4 bg-red-50/50 text-red-600 font-black border-r">우측 골도 (BC)</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="p-0 border-r min-w-[80px]">
                  <input id={`pta-in-${f}-rt_bc`} type="number" step="5" className="w-full p-4 text-center font-black outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={data.frequencies[f]?.rt_bc ?? ''} onChange={e => handleUpdate(f, 'rt_bc', e.target.value)} onKeyDown={e => handleKeyDown(e, f, 'rt_bc')} onFocus={e => e.target.select()} />
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 bg-blue-50/50 text-blue-600 font-black border-r">좌측 골도 (BC)</td>
              {FREQUENCIES.map(f => (
                <td key={f} className="p-0 border-r min-w-[80px]">
                  <input id={`pta-in-${f}-lt_bc`} type="number" step="5" className="w-full p-4 text-center font-black outline-none focus:bg-orange-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={data.frequencies[f]?.lt_bc ?? ''} onChange={e => handleUpdate(f, 'lt_bc', e.target.value)} onKeyDown={e => handleKeyDown(e, f, 'lt_bc')} onFocus={e => e.target.select()} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-center pt-8">
        <button onClick={handleSave} className="bg-orange-600 text-white px-28 py-6 rounded-3xl font-black text-2xl shadow-xl hover:scale-105 transition-all">최종 저장 및 통합 연동</button>
      </div>
    </div>
  );
};

export default PureToneAudiogram;
