import React, { useState, useMemo } from 'react';
import { AppState, Transaction, TransactionType } from '../types';

interface Props {
  type: TransactionType;
  state: AppState;
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

const TransactionManager: React.FC<Props> = ({ type, state, addTransaction, deleteTransaction }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: 0,
    description: '',
    reference: ''
  });

  const filteredTransactions = useMemo(() => {
    const txs = state.transactions.filter(t => t.type === type);
    if (!searchTerm.trim()) return txs;
    
    const term = searchTerm.toLowerCase();
    return txs.filter(t => 
      t.description.toLowerCase().includes(term) ||
      t.category.toLowerCase().includes(term) ||
      (t.reference && t.reference.toLowerCase().includes(term))
    );
  }, [state.transactions, type, searchTerm]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: Date.now().toString(),
      type,
      ...formData
    };
    addTransaction(newTx);
    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: '',
      amount: 0,
      description: '',
      reference: ''
    });
  };

  const categories = type === TransactionType.SALE 
    ? ['Product Sales', 'Service Fees', 'Subscription', 'Consulting', 'Advertising', 'Other']
    : ['Rent', 'Utilities', 'Salaries', 'Software', 'Marketing', 'Inventory', 'Travel', 'Other'];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Product Sales': return 'fa-box';
      case 'Service Fees': return 'fa-handshake';
      case 'Consulting': return 'fa-user-tie';
      case 'Salaries': return 'fa-users';
      case 'Marketing': return 'fa-bullhorn';
      case 'Rent': return 'fa-building';
      case 'Software': return 'fa-laptop-code';
      default: return 'fa-tags';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-xl text-white ${type === TransactionType.SALE ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              <i className={`fa-solid ${type === TransactionType.SALE ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'} text-lg`}></i>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {type === TransactionType.SALE ? 'Revenue Ledger' : 'Expense Tracker'}
            </h1>
          </div>
          <p className="text-slate-500 font-medium">Managing your company's <span className="text-slate-900 font-bold">{type.toLowerCase()}</span> transactions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3">
          <div className="relative flex-1 lg:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1-2 text-slate-400"></i>
            <input 
              type="text"
              placeholder={`Search records...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className={`px-6 py-3 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm active:scale-95 ${
              type === TransactionType.SALE ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-rose-600 shadow-rose-100 hover:bg-rose-700'
            }`}
          >
            <i className="fa-solid fa-plus"></i>
            Add Record
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className={`fa-solid ${type === TransactionType.SALE ? 'fa-receipt' : 'fa-money-bill-transfer'} text-4xl text-slate-200`}></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900">No transactions found</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            {searchTerm ? `We couldn't find matches for "${searchTerm}".` : `This ledger is currently empty. Start tracking your business finance.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <i className={`fa-solid ${getCategoryIcon(tx.category)} text-xl`}></i>
                   </div>
                   <div>
                      <h3 className="font-black text-slate-900 leading-tight truncate max-w-[150px]">{tx.category}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDateDisplay(tx.date)}</p>
                   </div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                   type === TransactionType.SALE ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`}>
                   {type}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Details</p>
                <p className="font-bold text-slate-800 line-clamp-2 min-h-[2.5rem] leading-tight mb-3">{tx.description}</p>
                
                <div className="pt-3 border-t border-slate-200 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Value</p>
                    <p className={`text-2xl font-black ${type === TransactionType.SALE ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {type === TransactionType.SALE ? '+' : '-'}{state.business.currency} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {tx.reference && (
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref</p>
                       <p className="text-xs font-bold text-slate-600">{tx.reference}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => deleteTransaction(tx.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                >
                  <i className="fa-solid fa-trash-can"></i> Remove Record
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${type === TransactionType.SALE ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    <i className="fa-solid fa-plus text-xl"></i>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add {type}</h2>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Record a financial movement manually.</p>
                 </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-slate-50 rounded-2xl transition-all">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Date</label>
                  <input 
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Value ({state.business.currency})</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</label>
                <select 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-bold appearance-none"
                >
                  <option value="">Choose category...</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Narration</label>
                <input 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-bold" 
                  placeholder="What was this movement for?"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Cross Reference (ID)</label>
                <input 
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-bold" 
                  placeholder="Receipt number or ID..."
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 border border-slate-200 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`px-10 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl text-[10px] transition-all active:scale-95 ${
                    type === TransactionType.SALE ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-rose-600 shadow-rose-100 hover:bg-rose-700'
                  }`}
                >
                  Commit to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;