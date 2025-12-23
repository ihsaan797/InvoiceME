import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BusinessDetails } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  business: BusinessDetails;
}

const Sidebar: React.FC<Props> = ({ isOpen, setIsOpen, business }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: 'fa-chart-pie', path: '/' },
    { name: 'Quotations', icon: 'fa-file-lines', path: '/quotations' },
    { name: 'Invoices', icon: 'fa-file-invoice-dollar', path: '/invoices' },
    { name: 'Clients', icon: 'fa-users', path: '/clients' },
    { name: 'Catalog', icon: 'fa-boxes-stacked', path: '/catalog' },
    { name: 'Sales', icon: 'fa-money-bill-trend-up', path: '/sales' },
    { name: 'Expenses', icon: 'fa-receipt', path: '/expenses' },
    { name: 'Settings', icon: 'fa-gear', path: '/settings' },
  ];

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden animate-fadeIn" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transform transition-transform duration-500 ease-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Area */}
        <div className="p-8 pb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
              <i className="fa-solid fa-bolt text-2xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Invoice ME</h1>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Professional</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-500 hover:text-white p-2"
          >
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40' 
                    : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className={`w-5 flex justify-center transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'}`}>
                  <i className={`fa-solid ${item.icon} text-lg`}></i>
                </div>
                <span className="font-bold text-sm tracking-tight">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></div>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User / Business Profile Area */}
        <div className="p-6 m-4 bg-slate-800/50 rounded-3xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center font-black text-slate-300">
              {business.name.charAt(0)}
            </div>
            <div className="min-w-0">
               <p className="text-xs font-black text-white truncate">{business.name}</p>
               <p className="text-[10px] font-medium text-slate-500 truncate">{business.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 select-none pt-4 border-t border-slate-700/50">
            <span className="text-[8px] uppercase font-black text-slate-600 tracking-widest">
              Digital Signature:
            </span>
            <span className="text-[10px] font-black tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              {business.poweredByText || 'SANDPIX MALDIVES'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;