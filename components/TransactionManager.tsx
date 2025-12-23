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
    ? ['Product Sales', 'Service Fees', 'Subscription', 'Consulting', 'Other']
    : ['Rent', 'Utilities', 'Salaries', 'Software', 'Marketing', 'Supplies', 'Other'];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{type === TransactionType.SALE ? 'Sales Ledger' : 'Expense Tracker'}</h1>
          <p className="text-sm text-slate-500">Keep track of your {type.toLowerCase()} transactions.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
            <div className="relative flex-1 md:w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                    type="text"
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                />
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className={`px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-white whitespace-nowrap ${
                    type === TransactionType.SALE ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-red-600 shadow-red-100 hover:bg-red-700'
                }`}
            >
                <i className="fa-solid fa-plus"></i>
                Add {type === TransactionType.SALE ? 'Sale' : 'Expense'}
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[650px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                           {searchTerm ? 'No matches found.' : 'No transactions recorded yet.'}
                      </td>
                  </tr>
              ) : filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-600 text-sm">{formatDateDisplay(tx.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium text-sm">{tx.description}</div>
                    {tx.reference && <div className="text-[10px] text-slate-400">REF: {tx.reference}</div>}
                  </td>
                  <td className={`px-6 py-4 font-bold text-sm ${type === TransactionType.SALE ? 'text-emerald-600' : 'text-red-600'}`}>
                     {type === TransactionType.SALE ? '+' : '-'}{state.business.currency} {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">New {type === TransactionType.SALE ? 'Sale' : 'Expense'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <input 
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount ({state.business.currency})</label>
                  <input 
                    required
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select 
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <input 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                  placeholder="What was this for?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reference (Optional)</label>
                <input 
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                  placeholder="Receipt # or Transaction ID"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-md text-sm ${
                    type === TransactionType.SALE ? 'bg-emerald-600 shadow-emerald-50 hover:bg-emerald-700' : 'bg-red-600 shadow-red-50 hover:bg-red-700'
                  }`}
                >
                  Save Entry
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