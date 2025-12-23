import React, { useState, useMemo } from 'react';
import { AppState, Client } from '../types';

interface Props {
  state: AppState;
  addClient: (client: Client) => void;
  addClients: (clients: Client[]) => void;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
}

const ClientManager: React.FC<Props> = ({ state, addClient, addClients, updateClient, deleteClient }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return state.clients;
    const term = searchTerm.toLowerCase();
    return state.clients.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term)
    );
  }, [state.clients, searchTerm]);

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', address: '' });
    setEditingId(null);
    setShowModal(false);
    setErrorMsg(null);
  };

  const handleEdit = (client: Client) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address
    });
    setEditingId(client.id);
    setShowModal(true);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Duplicate Check
    const isDuplicate = state.clients.some(c => 
      c.id !== editingId && (
        c.name.toLowerCase() === formData.name.toLowerCase() || 
        c.email.toLowerCase() === formData.email.toLowerCase()
      )
    );

    if (isDuplicate) {
      setErrorMsg("A client with this name or email already exists in your predefined list.");
      return;
    }

    if (editingId) {
      updateClient({ id: editingId, ...formData });
    } else {
      addClient({ id: Date.now().toString(), ...formData });
    }
    resetForm();
  };

  const handleSyncFromDocs = () => {
    const clientsInDocs = new Map<string, { name: string, email: string }>();
    
    // Extract unique name/email pairs from documents
    state.documents.forEach(doc => {
      const key = `${doc.clientName.toLowerCase()}|${doc.clientEmail.toLowerCase()}`;
      if (!clientsInDocs.has(key)) {
        clientsInDocs.set(key, { name: doc.clientName, email: doc.clientEmail });
      }
    });

    const newClientsToAdd: Client[] = [];
    let duplicateCount = 0;

    clientsInDocs.forEach(item => {
      const exists = state.clients.some(c => 
        c.name.toLowerCase() === item.name.toLowerCase() || 
        c.email.toLowerCase() === item.email.toLowerCase()
      );

      if (!exists) {
        newClientsToAdd.push({
          id: `sync-${Date.now()}-${Math.random()}`,
          name: item.name,
          email: item.email,
          phone: '',
          address: ''
        });
      } else {
        duplicateCount++;
      }
    });

    if (newClientsToAdd.length > 0) {
      addClients(newClientsToAdd);
      setSyncMsg(`Successfully synced ${newClientsToAdd.length} new clients from your documents.`);
    } else {
      setSyncMsg(duplicateCount > 0 ? "All clients from documents are already in your list." : "No clients found in existing documents.");
    }

    setTimeout(() => setSyncMsg(null), 5000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Client Database</h1>
          <p className="text-slate-500 mt-1">Manage and organize your client relationships.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3">
          <div className="relative flex-1 lg:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
            />
          </div>
          <button 
            onClick={handleSyncFromDocs}
            className="bg-white text-blue-600 border border-blue-100 px-5 py-3 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm"
          >
            <i className="fa-solid fa-cloud-arrow-down"></i>
            Sync History
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm shadow-xl shadow-slate-200"
          >
            <i className="fa-solid fa-user-plus"></i>
            Add Client
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-5 py-4 rounded-2xl flex items-center gap-3 text-sm animate-fadeIn shadow-sm">
          <div className="bg-blue-100 p-2 rounded-lg">
            <i className="fa-solid fa-circle-info"></i>
          </div>
          <span className="font-medium">{syncMsg}</span>
        </div>
      )}

      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-users-slash text-3xl text-slate-300"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900">No clients found</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">
            {searchTerm 
              ? `We couldn't find any results for "${searchTerm}".` 
              : "Your client list is currently empty. Start by adding your first client."}
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div 
              key={client.id} 
              className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden flex flex-col"
            >
              {/* Card Decoration */}
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-user-tie text-8xl"></i>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-slate-200 shrink-0">
                  {getInitials(client.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate" title={client.name}>
                    {client.name}
                  </h3>
                  <p className="text-slate-500 text-sm truncate">{client.email}</p>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:text-blue-500 transition-colors">
                    <i className="fa-solid fa-phone text-xs"></i>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</p>
                    <p className="text-slate-700 text-sm font-medium">{client.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-colors">
                    <i className="fa-solid fa-location-dot text-xs"></i>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Address</p>
                    <p className="text-slate-700 text-sm font-medium line-clamp-2" title={client.address}>
                      {client.address || 'No address saved'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                <button 
                  onClick={() => handleEdit(client)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                >
                  <i className="fa-solid fa-pencil"></i>
                  Edit
                </button>
                <button 
                  onClick={() => deleteClient(client.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {editingId ? 'Edit Profile' : 'New Client'}
              </h2>
              <button onClick={() => resetForm()} className="text-slate-400 hover:text-slate-600 p-2 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <i className="fa-solid fa-triangle-exclamation text-sm"></i>
                  {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Full Name / Company</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm transition-all" 
                    placeholder="e.g. John Doe or SANDPIX"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm transition-all" 
                      placeholder="client@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone</label>
                    <input 
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm transition-all" 
                      placeholder="+960 ..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Physical Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm min-h-[100px] transition-all resize-none" 
                    placeholder="Enter detailed address..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => resetForm()} 
                  className="px-6 py-3.5 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 text-sm transition-all active:scale-95"
                >
                  {editingId ? 'Update Client' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;