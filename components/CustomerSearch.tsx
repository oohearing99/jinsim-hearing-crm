
import React, { useState } from 'react';
import { Customer } from '../types';
import { Search, UserPlus, Phone, User, Calendar } from 'lucide-react';

interface Props {
  customers: Customer[];
  onSelect: (c: Customer) => void;
  onCreate: (c: Partial<Customer>) => void;
}

const CustomerSearch: React.FC<Props> = ({ customers, onSelect, onCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    birth_date: '',
    gender: 'M'
  });

  const filtered = customers.filter(c => 
    c.phone.includes(searchTerm) || c.name.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCustomer.name && newCustomer.phone) {
      onCreate(newCustomer);
      setIsAdding(false);
      setNewCustomer({ name: '', phone: '', birth_date: '', gender: 'M' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="이름 또는 휴대폰 번호 뒷자리 검색..." 
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            <UserPlus className="w-5 h-5" />
            신규 고객 등록
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            새로운 고객 정보를 입력하세요
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">성함 *</label>
              <input 
                required
                type="text" 
                className="w-full p-2 border border-blue-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                value={newCustomer.name}
                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">연락처 *</label>
              <input 
                required
                type="tel" 
                placeholder="010-0000-0000"
                className="w-full p-2 border border-blue-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                value={newCustomer.phone}
                onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-700 mb-1">생년월일</label>
              <input 
                type="date" 
                className="w-full p-2 border border-blue-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                value={newCustomer.birth_date || ''}
                onChange={e => setNewCustomer({...newCustomer, birth_date: e.target.value})}
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-md font-bold hover:bg-blue-700 transition-colors">등록하기</button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-2 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100">취소</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length > 0 ? filtered.map(customer => (
          <div 
            key={customer.id} 
            onClick={() => onSelect(customer)}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="bg-slate-100 p-3 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <User className="w-6 h-6" />
              </div>
            </div>
            <h4 className="text-lg font-bold mb-1">{customer.name}</h4>
            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
              {customer.birth_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{customer.birth_date}</span>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
              <span>최종 상담: {new Date(customer.updated_at).toLocaleDateString()}</span>
              <button className="text-blue-600 font-semibold group-hover:underline">상세보기 &rarr;</button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
             <Search className="w-12 h-12 mb-4 opacity-20" />
             <p>등록된 고객이 없거나 검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSearch;
