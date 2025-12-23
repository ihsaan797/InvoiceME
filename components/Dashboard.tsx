import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, TransactionType, DocumentType } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie 
} from 'recharts';

interface Props {
  state: AppState;
}

const Dashboard: React.FC<Props> = ({ state }) => {
  const { transactions, documents, business } = state;
  const navigate = useNavigate();

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

  const chartData = useMemo(() => {
    // Mock data for visual appeal in this demo context
    // In a real app, this would be grouped by day/month from transactions
    return [
      { name: 'Mon', sales: 4000, expenses: 2400 },
      { name: 'Tue', sales: 3000, expenses: 1398 },
      { name: 'Wed', sales: 2000, expenses: 9800 },
      { name: 'Thu', sales: 2780, expenses: 3908 },
      { name: 'Fri', sales: 1890, expenses: 4800 },
      { name: 'Sat', sales: 2390, expenses: 3800 },
      { name: 'Sun', sales: 3490, expenses: 4300 },
    ];
  }, []);

  const pieData = [
    { name: 'Sales', value: totalSales || 1 },
    { name: 'Expenses', value: totalExpenses || 0 },
  ];

  const recentDocs = useMemo(() => {
    return [...documents].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  }, [documents]);

  const COLORS = ['#2563eb', '#f43f5e'];

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Hero Header with Quick Actions */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hello, {business.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening with your business today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/invoices')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
          >
            <i className="fa-solid fa-file-invoice"></i>
            New Invoice
          </button>
          <button 
            onClick={() => navigate('/expenses')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95"
          >
            <i className="fa-solid fa-plus"></i>
            Record Expense
          </button>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-vault text-xl"></i>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">REVENUE</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500">Total Sales</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {business.currency} {totalSales.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-credit-card text-xl"></i>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">OUTFLOW</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500">Total Expenses</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {business.currency} {totalExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-emerald-200 transition-all md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-piggy-bank text-xl"></i>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">PROFIT</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-500">Net Profit</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight">
              {business.currency} {profit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart (Large) */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Revenue Flow</h3>
              <p className="text-sm text-slate-500">Daily sales vs expenses trend</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer">
                <option>Last 7 Days</option>
                <option>Monthly View</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}} 
                />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorExpenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation/Margin (Small) */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <i className="fa-solid fa-chart-pie text-8xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Performance</h3>
            <p className="text-sm text-slate-500 mb-8">Current Profit Margin</p>
            
            <div className="h-56 w-full flex items-center justify-center relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
                            paddingAngle={10}
                            dataKey="value"
                            stroke="none"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center">
                    <p className="text-3xl font-black text-slate-900">{profitMargin}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margin</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full mt-6">
              <div className="bg-blue-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Income</p>
                <p className="text-sm font-bold text-blue-700">{Math.round((totalSales / (totalSales + totalExpenses || 1)) * 100)}%</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Expenses</p>
                <p className="text-sm font-bold text-rose-700">{Math.round((totalExpenses / (totalSales + totalExpenses || 1)) * 100)}%</p>
              </div>
            </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Recent Documents</h3>
            <button 
              onClick={() => navigate('/invoices')}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 italic">
                    No documents created yet.
                  </td>
                </tr>
              ) : recentDocs.map(doc => {
                const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
                const total = subtotal + (subtotal * business.taxPercentage / 100);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(doc.type === DocumentType.INVOICE ? '/invoices' : '/quotations')}>
                    <td className="px-8 py-4 font-bold text-slate-900 text-sm">{doc.number}</td>
                    <td className="px-8 py-4">
                      <p className="text-sm font-semibold text-slate-800">{doc.clientName}</p>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-500">{formatDateDisplay(doc.date)}</td>
                    <td className="px-8 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        doc.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                        doc.status === 'Sent' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right font-black text-slate-900 text-sm">
                      {business.currency} {total.toLocaleString()}
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