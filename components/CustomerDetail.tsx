
import React, { useMemo, useState } from 'react';
import { Customer, Visit } from '../types';
import { Calendar, Plus, ChevronRight, FileText, Clock, Headphones, CheckCircle2, Layers, X, FileEdit } from 'lucide-react';

interface Props {
  customer: Customer;
  visits: Visit[];
  onSelectVisit: (v: Visit) => void;
  onCreateVisit: () => void;
  onUpdateCustomer: (updatedCustomer: Customer) => void;
}

// 같은 날짜 + 같은 유형(ha_stage 또는 visit_type)의 방문을 그룹화
interface VisitGroup {
  key: string;
  date: string;
  visitType: string;
  haStage: string | null;
  haStageLabel: string | null;
  visits: Visit[];
  latestVisit: Visit;
}

const CustomerDetail: React.FC<Props> = ({ customer, visits, onSelectVisit, onCreateVisit, onUpdateCustomer }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Customer>(customer);

  // 방문들을 날짜 + 유형별로 그룹화
  const groupedVisits = useMemo(() => {
    const groups: Map<string, VisitGroup> = new Map();

    visits.forEach(visit => {
      // 그룹 키: 날짜 + visit_type + ha_stage
      const groupKey = `${visit.visit_date}_${visit.visit_type}_${visit.ha_stage || 'GENERAL'}`;

      if (groups.has(groupKey)) {
        const group = groups.get(groupKey)!;
        group.visits.push(visit);
        // 최신 방문으로 업데이트 (created_at 기준)
        if (new Date(visit.created_at) > new Date(group.latestVisit.created_at)) {
          group.latestVisit = visit;
        }
      } else {
        groups.set(groupKey, {
          key: groupKey,
          date: visit.visit_date,
          visitType: visit.visit_type,
          haStage: visit.ha_stage,
          haStageLabel: visit.ha_stage_label || null,
          visits: [visit],
          latestVisit: visit
        });
      }
    });

    // 날짜 역순으로 정렬
    return Array.from(groups.values()).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [visits]);
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden" data-capture="customer-info">
        <div className="bg-blue-600 h-24"></div>
        <div className="px-8 pb-8 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border-4 border-white flex items-center justify-center text-blue-600">
                <span className="text-3xl font-bold">{customer.name[0]}</span>
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-1">
                   <h3 className="text-2xl font-bold">{customer.name}</h3>
                   <span className={`px-2 py-0.5 rounded text-xs font-bold ${customer.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {customer.gender === 'M' ? '남성' : '여성'}
                   </span>
                </div>
                <p className="text-slate-500 font-medium">{customer.phone}</p>
              </div>
            </div>
            <div className="flex gap-3 pb-2">
              <button
                onClick={() => {
                  setEditedCustomer(customer);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                정보 수정
              </button>
              <button
                onClick={onCreateVisit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                새 상담/프로콜 시작
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10">
            <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">생년월일</p><p className="font-semibold text-slate-700">{customer.birth_date || '-'}</p></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">청각장애</p><p className="font-semibold text-slate-700">{customer.disability_status === 'Y' ? '등록 (중증)' : '미등록'}</p></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">보청기 경험</p><p className="font-semibold text-slate-700">{customer.hearing_aid_experience === 'Y' ? '있음' : '없음'}</p></div>
            <div><p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">총 방문 횟수</p><p className="font-semibold text-slate-700">{visits.length}회</p></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-slate-400" />방문 타임라인</h4>
        <div className="grid grid-cols-1 gap-4">
          {groupedVisits.length > 0 ? groupedVisits.map(group => (
            <div
              key={group.key}
              onClick={() => onSelectVisit(group.latestVisit)}
              className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                  <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">방문일</span>
                  <span className="text-base font-bold text-slate-700 group-hover:text-blue-600">{group.date.slice(-2)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-bold text-slate-800">{group.date} 상담</h5>
                    {group.visitType === 'HA_PROTOCOL' && (
                      <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-black border border-orange-200">
                        {group.haStageLabel || '보청기 프로토콜'}
                      </span>
                    )}
                    {group.visits.length > 1 && (
                      <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-black border border-slate-200 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {group.visits.length}개 통합
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{group.latestVisit.counselor_name} 상담사 | {group.latestVisit.purpose.join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-1">
                   {group.visitType === 'HA_PROTOCOL' && <div className="w-8 h-8 rounded-full border-2 border-white bg-orange-100 text-orange-600 flex items-center justify-center" title="프로토콜"><CheckCircle2 className="w-4 h-4" /></div>}
                   <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 text-blue-600 flex items-center justify-center" title="상담지"><FileText className="w-4 h-4" /></div>
                   <div className="w-8 h-8 rounded-full border-2 border-white bg-purple-100 text-purple-600 flex items-center justify-center" title="어음검사"><Headphones className="w-4 h-4" /></div>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       const blogUrl = `/blog-post?visitId=${group.latestVisit.id}&customerId=${customer.id}`;
                       window.open(blogUrl, '_blank', 'width=900,height=800,scrollbars=yes,resizable=yes');
                     }}
                     className="w-8 h-8 rounded-full border-2 border-white bg-pink-100 text-pink-600 flex items-center justify-center hover:bg-pink-200 transition-colors"
                     title="블로그 포스팅"
                   >
                     <FileEdit className="w-4 h-4" />
                   </button>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all" />
              </div>
            </div>
          )) : (
            <div className="py-20 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-slate-400">
               <Calendar className="w-10 h-10 mb-2 opacity-20" /><p>아직 방문 기록이 없습니다.</p>
               <button onClick={onCreateVisit} className="mt-4 text-blue-600 font-bold hover:underline">첫 방문 기록하기 &rarr;</button>
            </div>
          )}
        </div>
      </div>

      {/* 정보 수정 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black">고객 정보 수정</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateCustomer({
                  ...editedCustomer,
                  updated_at: new Date().toISOString()
                });
                setIsEditModalOpen(false);
              }}
              className="p-8 space-y-6 max-h-[70vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    성함 *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.name}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    연락처 *
                  </label>
                  <input
                    required
                    type="tel"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.phone}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    성별
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.gender || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, gender: e.target.value as 'M' | 'F' | null })}
                  >
                    <option value="">선택 안함</option>
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    생년월일
                  </label>
                  <input
                    type="date"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.birth_date || ''}
                    onChange={(e) => {
                      const birthDate = e.target.value;
                      const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : null;
                      setEditedCustomer({ ...editedCustomer, birth_date: birthDate || null, age });
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    주소
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.address || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    보호자명
                  </label>
                  <input
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.guardian_name || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, guardian_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    보호자 연락처
                  </label>
                  <input
                    type="tel"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.guardian_phone || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, guardian_phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    청각장애 등록 여부
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.disability_status || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, disability_status: e.target.value as 'Y' | 'N' | null })}
                  >
                    <option value="">선택 안함</option>
                    <option value="Y">예 (등록)</option>
                    <option value="N">아니오 (미등록)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    장애 등록일
                  </label>
                  <input
                    type="date"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.disability_date || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, disability_date: e.target.value || undefined })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    보청기 경험
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.hearing_aid_experience || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, hearing_aid_experience: e.target.value as 'Y' | 'N' | null })}
                  >
                    <option value="">선택 안함</option>
                    <option value="Y">예 (있음)</option>
                    <option value="N">아니오 (없음)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    수술 이력
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    value={editedCustomer.surgery_history || ''}
                    onChange={(e) => setEditedCustomer({ ...editedCustomer, surgery_history: e.target.value as 'Y' | 'N' | null })}
                  >
                    <option value="">선택 안함</option>
                    <option value="Y">예 (있음)</option>
                    <option value="N">아니오 (없음)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-xl transition-all"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
