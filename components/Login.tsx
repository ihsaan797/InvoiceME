import React, { useState } from 'react';
import { User } from '../types';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
  poweredBy?: string;
}

const Login: React.FC<Props> = ({ users, onLogin, poweredBy = 'SANDPIX MALDIVES' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate delay for high-end feel
    setTimeout(() => {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      
      if (user) {
        if (user.isEnabled === false) {
           setError("Access Revoked. Please contact system administrator.");
           setIsLoading(false);
           return;
        }
        onLogin(user);
      } else {
        setError("Invalid credentials. Access restricted.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 selection:bg-blue-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Mesh Gradient Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-[440px] animate-fadeIn relative z-10 flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] mx-auto mb-8 active:scale-95 transition-transform cursor-pointer group">
            <i className="fa-solid fa-bolt text-4xl text-white group-hover:scale-110 transition-transform"></i>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">Invoice <span className="text-blue-500">ME</span></h1>
          <p className="text-slate-400 font-medium tracking-wide">Enterprise Command Center</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border border-white/5 p-10 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle reflection border */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest flex items-center gap-3 animate-fadeIn">
                <i className="fa-solid fa-shield-halved text-lg"></i>
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Identity</label>
              <div className="relative group">
                <i className="fa-solid fa-user absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"></i>
                <input 
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/50 rounded-2xl px-14 py-5 outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500 text-white font-bold transition-all placeholder:text-slate-700"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 ml-1">Security Key</label>
              <div className="relative group">
                <i className="fa-solid fa-fingerprint absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"></i>
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/50 rounded-2xl px-14 py-5 outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-500 text-white font-bold transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] mt-10"
            >
              {isLoading ? (
                <i className="fa-solid fa-circle-notch fa-spin text-xl"></i>
              ) : (
                <>
                  Establish Session
                  <i className="fa-solid fa-arrow-right-long text-sm"></i>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Neon Powered By Footer */}
      <div className="mt-12 mb-4 text-center z-10 animate-slideUp" style={{ animationDelay: '0.4s' }}>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">Authenticated System</p>
        <div className="flex items-center justify-center gap-2">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Powered By</span>
           <span className="text-[12px] font-black neon-text-cyan tracking-[0.2em] uppercase italic">{poweredBy}</span>
        </div>
      </div>
    </div>
  );
};

export default Login;