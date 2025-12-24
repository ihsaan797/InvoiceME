import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BusinessDetails, User } from '../types';

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  business: BusinessDetails;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<Props> = ({ isOpen, setIsOpen, business, currentUser, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: 'fa-chart-pie', path: '/', roles: ['admin', 'user'] },
    { name: 'Quotations', icon: 'fa-file-lines', path: '/quotations', roles: ['admin', 'user'] },
    { name: 'Invoices', icon: 'fa-file-invoice-dollar', path: '/invoices', roles: ['admin', 'user'] },
    { name: 'Clients', icon: 'fa-users', path: '/clients', roles: ['admin', 'user'] },
    { name: 'Catalog', icon: 'fa-boxes-stacked', path: '/catalog', roles: ['admin', 'user'] },
    { name: 'Sales', icon: 'fa-money-bill-trend-up', path: '/sales', roles: ['admin', 'user'] },
    { name: 'Expenses', icon: 'fa-receipt', path: '/expenses', roles: ['admin', 'user'] },
    { name: 'Users', icon: 'fa-user-gear', path: '/users', roles: ['admin'] },
    { name: 'Settings', icon: 'fa-gear', path: '/settings', roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(currentUser.role));

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
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Ledger v2.0</span>
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
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredItems.map((item) => {
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
        <div className="p-6 m-4 bg-slate-800/50 rounded-3xl border border-slate-700/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
               <p className="text-xs font-black text-white truncate">{currentUser.name}</p>
               <span className="text-[8px] px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full font-black uppercase tracking-widest">{currentUser.role}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-700/50">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all font-bold text-xs"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              Logout
            </button>
          </div>
        </div>

        {/* Sidebar Neon Footer */}
        <div className="px-8 pb-8 text-center">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Powered By</p>
            <p className="text-[10px] font-black neon-text-blue uppercase tracking-widest italic">{business.poweredByText}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;