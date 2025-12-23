import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<Props> = ({ isOpen, setIsOpen }) => {
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fa-solid fa-bolt text-xl"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Invoice ME</h1>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 mt-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-5`}></i>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-6 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">v1.0.0 Stable</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;