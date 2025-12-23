import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, TransactionType, DocumentType } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  state: AppState;
}

const Dashboard: React.FC<Props> = ({ state }) => {
  const { transactions, documents, business } = state;
  const navigate = useNavigate();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  const totalSales = useMemo(() => 
    transactions.filter(t => t.type === TransactionType.SALE).reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(() => 
    transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0),
    [transactions]
  );

  const profit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? Math.round((profit / totalSales) * 100) : 0;
  
  const expenseRatio = totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0;

  // AI Business Insight Generation
  useEffect(() => {
    const generateInsight = async () => {
      if (transactions.length === 0) return;
      setIsLoadingInsight(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const summary = transactions.map(t => `${t.type}: ${t.amount} (${t.category})`).slice(0, 10).join(', ');
        const prompt = `Act as a high-level financial advisor for "${business.name}". Based on these transactions: [${summary}]. Total Revenue: ${totalSales}, Total Expenses: ${totalExpenses}. Provide a 2-sentence executive strategic insight.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });
        setAiInsight(response.text || null);
      } catch (err) {
        console.error("AI Insight Error:", err);
      } finally {
        setIsLoadingInsight(false);
      }
    };

    const timer = setTimeout(generateInsight, 1000);
    return () => clearTimeout(timer);
  }, [transactions, business.name, totalSales, totalExpenses]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Business <span className="text-blue-600 font-light">/ Control</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time fiscal monitoring for <span className="text-slate-900 font-bold">{business.name}</span>.</p>
        </div>
        
        <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Global Ledger Synced</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Revenue', value: totalSales, color: 'blue', icon: 'fa-sack-dollar' },
          { label: 'Expenses', value: totalExpenses, color: 'rose', icon: 'fa-credit-card' },
          { label: 'Net Profit', value: profit, color: 'emerald', icon: 'fa-piggy-bank' },
          { label: 'Margin', value: `${profitMargin}%`, color: 'indigo', icon: 'fa-chart-line' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group overflow-hidden relative">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center p-6`}>
               <i className={`fa-solid ${stat.icon} text-4xl text-${stat.color}-200`}></i>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
            <h2 className="text-2xl font-black text-slate-900 truncate">
              {typeof stat.value === 'number' ? `${business.currency} ${stat.value.toLocaleString()}` : stat.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Main Analysis Area - Executive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Smart Insights Panel */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20 flex flex-col justify-center min-h-[350px]">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <i className="fa-solid fa-wand-magic-sparkles text-9xl"></i>
          </div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">AI Intelligence</span>
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest tracking-widest">Analytical Core</span>
            </div>
            <h4 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">Financial Strategy <br/><span className="text-blue-500">Optimization</span></h4>
            {isLoadingInsight ? (
              <div className="space-y-4 animate-pulse pt-4">
                <div className="h-5 bg-slate-800 rounded-full w-full"></div>
                <div className="h-5 bg-slate-800 rounded-full w-4/5"></div>
                <div className="h-5 bg-slate-800 rounded-full w-2/3"></div>
              </div>
            ) : aiInsight ? (
              <p className="text-slate-300 text-xl font-medium leading-relaxed italic border-l-4 border-blue-500 pl-8 py-2 max-w-3xl">
                "{aiInsight}"
              </p>
            ) : (
              <p className="text-slate-500 text-lg italic">Record more data points to unlock bespoke financial optimization strategies.</p>
            )}
          </div>
        </div>

        {/* Executive Liquidity Snapshot (No Charts) */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Capital Health</h4>
            <div className="space-y-10">
              <div>
                <div className="flex justify-between items-end mb-3">
                  <p className="text-sm font-black text-slate-900">Revenue Utilization</p>
                  <p className="text-xs font-bold text-slate-500">{Math.round(100 - expenseRatio)}% Saved</p>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, (totalSales / (totalSales + totalExpenses || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-3">
                  <p className="text-sm font-black text-slate-900">Expense Burden</p>
                  <p className="text-xs font-bold text-rose-500">{Math.round(expenseRatio)}% Ratio</p>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, expenseRatio)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                 <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <p className={`text-sm font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {profit >= 0 ? 'SOLVENT' : 'CAPITAL DEFICIT'}
                      </p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</p>
                       <p className="text-sm font-black text-slate-900">{profitMargin}% ROI</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/sales')}
            className="w-full mt-8 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] transition-all"
          >
            Audit Transactions
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Trail</h3>
              <p className="text-sm text-slate-500 font-medium">Recent document movements and recorded status.</p>
            </div>
            <button 
              onClick={() => navigate('/invoices')}
              className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-200 hover:bg-black transition-all"
            >
              Full Ledger
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.slice(0, 5).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-24 text-center text-slate-400 italic font-medium">
                    No active documents found. Initiate a quotation or invoice to populate the audit trail.
                  </td>
                </tr>
              ) : documents.slice(0, 5).map(doc => {
                const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
                const total = subtotal + (subtotal * business.taxPercentage / 100);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(doc.type === DocumentType.INVOICE ? '/invoices' : '/quotations')}>
                    <td className="px-10 py-6 font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{doc.number}</td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-slate-800">{doc.clientName}</p>
                      <p className="text-[10px] font-medium text-slate-400">{doc.clientEmail}</p>
                    </td>
                    <td className="px-10 py-6 text-sm font-medium text-slate-500">{formatDateDisplay(doc.date)}</td>
                    <td className="px-10 py-6">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl border ${
                        doc.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        doc.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-900 text-sm">
                      {business.currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;