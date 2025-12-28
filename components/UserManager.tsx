import React, { useState } from 'react';
import { AppState, User, UserRole } from '../types';

interface Props {
  state: AppState;
  addUser: (user: User) => Promise<boolean | undefined>;
  updateUser: (user: User) => Promise<boolean | undefined>;
  deleteUser: (id: string) => void;
}

const UserManager: React.FC<Props> = ({ state, addUser, updateUser, deleteUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'user' as UserRole,
    isEnabled: true
  });

  const resetForm = () => {
    setFormData({ name: '', username: '', password: '', role: 'user', isEnabled: true });
    setEditingId(null);
    setShowModal(false);
    setErrorMsg(null);
    setIsSubmitting(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role,
      isEnabled: user.isEnabled
    });
    setEditingId(user.id);
    setShowModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    if (user.username === 'Ihsaan') return; // Prevent disabling root admin
    try {
      await updateUser({
        ...user,
        isEnabled: !user.isEnabled
      });
    } catch (err) {
      console.error("Failed to toggle user status:", err);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.username === 'Ihsaan') {
      alert("Root administrator account cannot be purged.");
      return;
    }
    if (window.confirm(`PERMANENT ACTION: Purge access and data for ${user.name}?`)) {
      deleteUser(user.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    
    try {
        const isDuplicate = state.users.some(u => 
          String(u.id) !== String(editingId) && 
          u.username.toLowerCase() === formData.username.toLowerCase()
        );

        if (isDuplicate) {
          setErrorMsg("This username is already taken. Please choose a unique identity.");
          setIsSubmitting(false);
          return;
        }

        if (editingId) {
          const success = await updateUser({
            id: editingId,
            ...formData
          });
          if (success) resetForm();
        } else {
          // Destructure isEnabled to avoid duplicate key in the insert payload
          const { isEnabled, ...rest } = formData;
          const success = await addUser({
            id: `temp-${Date.now()}`,
            ...rest,
            isEnabled: isEnabled ?? true
          } as User);
          if (success) resetForm();
        }
    } catch (err: any) {
        setErrorMsg(err.message || "Failed to establish user record. Verify system connectivity.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl text-white bg-blue-600">
              <i className="fa-solid fa-user-gear text-lg"></i>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Access</h1>
          </div>
          <p className="text-slate-500 font-medium">Manage user accounts, permissions, and session status.</p>
        </div>
        
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-slate-200"
        >
          <i className="fa-solid fa-plus"></i>
          Provision User
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.users.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-10 py-12 text-center text-slate-400 font-medium italic">No active users recorded.</td>
                </tr>
              ) : state.users.map(u => (
                <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${!u.isEnabled ? 'opacity-60' : ''}`}>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${u.isEnabled ? 'bg-slate-100 text-slate-500' : 'bg-slate-200 text-slate-400'}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                         <span className="font-bold text-slate-900 block">{u.name}</span>
                         {!u.isEnabled && <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Suspended</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <button 
                      onClick={() => handleToggleStatus(u)}
                      disabled={u.username === 'Ihsaan'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-30 ${u.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${u.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-10 py-6 text-sm font-medium text-slate-600">{u.username}</td>
                  <td className="px-10 py-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                      u.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Edit User"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        disabled={u.username === 'Ihsaan'}
                        onClick={() => handleDelete(u)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30"
                        title="Purge User"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">
                {editingId ? 'Modify Account' : 'Provision Account'}
              </h2>
              <button disabled={isSubmitting} onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <i className="fa-solid fa-circle-exclamation text-sm"></i>
                  {errorMsg}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <input required disabled={isSubmitting} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-600 font-bold disabled:opacity-50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                  <input required disabled={isSubmitting} value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-600 font-bold disabled:opacity-50" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                  <input required disabled={isSubmitting} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-600 font-bold disabled:opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Role</label>
                <select 
                  disabled={isSubmitting || formData.username === 'Ihsaan'} 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-600 font-bold appearance-none disabled:opacity-50"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">System Admin</option>
                </select>
                {formData.username === 'Ihsaan' && (
                  <p className="text-[9px] text-slate-400 italic mt-1 ml-1">Root administrator role is persistent.</p>
                )}
              </div>
              
              {editingId && formData.username !== 'Ihsaan' && (
                <div className="flex items-center gap-3 pt-2">
                    <input 
                        type="checkbox" 
                        id="isEnabled" 
                        checked={formData.isEnabled} 
                        onChange={(e) => setFormData({...formData, isEnabled: e.target.checked})}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isEnabled" className="text-sm font-bold text-slate-700">Account Access Enabled</label>
                </div>
              )}

              <div className="pt-6 flex justify-end gap-3">
                <button type="button" disabled={isSubmitting} onClick={() => resetForm()} className="px-8 py-4 border border-slate-200 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-slate-500 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 text-[10px] disabled:opacity-70 flex items-center gap-2">
                  {isSubmitting ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Processing...
                      </>
                  ) : (editingId ? 'Update Profile' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;