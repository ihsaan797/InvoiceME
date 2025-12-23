import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, TransactionType, DocumentType } from '../types';
import { 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
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

  // AI Business Insight Generation
  useEffect(() => {
    const generateInsight = async () => {
      if (transactions.length === 0) return;
      setIsLoadingInsight(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const summary = transactions.map(t => `${t.type}: ${t.amount} (${t.category})`).slice(0, 10).join(', ');
        const prompt = `Act as a high-level financial advisor. Based on these recent transactions for "${business.name}": [${summary}]. Total Sales: ${totalSales}, Total Expenses: ${totalExpenses}. Give a 2-sentence professional strategic advice. Be concise.`;
        
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
            Dashboard <span className="text-blue-600 font-light">/ Overview</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Monitoring the financial health of <span className="text-slate-900 font-bold">{business.name}</span>.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Sync: Active</span>
           </div>
        </div>
      </div>

      {/* Stats Cards - Premium Bento Style */}
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

      {/* Main Analysis Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Smart Insights Panel */}
        <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20 flex flex-col justify-center min-h-[300px]">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <i className="fa-solid fa-wand-magic-sparkles text-8xl"></i>
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">AI Intelligence</span>
            </div>
            <h4 className="text-3xl font-black leading-tight tracking-tight">Smart Business Insights</h4>
            {isLoadingInsight ? (
              <div className="space-y-4 animate-pulse pt-2">
                <div className="h-4 bg-slate-800 rounded-full w-full"></div>
                <div className="h-4 bg-slate-800 rounded-full w-4/5"></div>
                <div className="h-4 bg-slate-800 rounded-full w-3/4"></div>
              </div>
            ) : aiInsight ? (
              <p className="text-slate-300 text-lg font-medium leading-relaxed italic border-l-4 border-blue-500 pl-6 py-2">
                "{aiInsight}"
              </p>
            ) : (
              <p className="text-slate-500 text-sm italic">Record more transactions to unlock AI-powered growth insights.</p>
            )}
          </div>
        </div>

        {/* Profit Distribution */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Capital Allocation</h4>
          <div className="h-56 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={[{ name: 'Sales', value: totalSales || 1 }, { name: 'Expenses', value: totalExpenses || 0 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell fill="#2563eb" cornerRadius={12} />
                        <Cell fill="#f43f5e" cornerRadius={12} />
                    </Pie>
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-4xl font-black text-slate-900">{profitMargin}%</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Margin</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-8 max-w-sm">
            <div className="bg-blue-50/50 p-5 rounded-3xl text-center border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Inflow</p>
              <p className="text-xl font-black text-blue-700">
                {Math.round((totalSales / (totalSales + totalExpenses || 1)) * 100)}%
              </p>
            </div>
            <div className="bg-rose-50/50 p-5 rounded-3xl text-center border border-rose-100">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Outflow</p>
              <p className="text-xl font-black text-rose-700">
                {Math.round((totalExpenses / (totalSales + totalExpenses || 1)) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <p className="text-sm text-slate-500 font-medium">Latest invoices and recorded documents</p>
            </div>
            <button 
              onClick={() => navigate('/invoices')}
              className="px-6 py-2.5 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              All Records
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stakeholder</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.slice(0, 5).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 italic font-medium">
                    Initial setup complete. Waiting for first document entry.
                  </td>
                </tr>
              ) : documents.slice(0, 5).map(doc => {
                const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
                const total = subtotal + (subtotal * business.taxPercentage / 100);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(doc.type === DocumentType.INVOICE ? '/invoices' : '/quotations')}>
                    <td className="px-8 py-5 font-black text-slate-900 text-sm group-hover:text-blue-600 transition-colors">{doc.number}</td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-800">{doc.clientName}</p>
                      <p className="text-[10px] font-medium text-slate-400">{doc.clientEmail}</p>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{formatDateDisplay(doc.date)}</td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${
                        doc.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        doc.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 text-sm">
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