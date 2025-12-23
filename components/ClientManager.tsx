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

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">Manage your predefined client database.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
            />
          </div>
          <button 
            onClick={handleSyncFromDocs}
            className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm"
          >
            <i className="fa-solid fa-rotate"></i>
            Sync from Docs
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-black transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm"
          >
            <i className="fa-solid fa-user-plus"></i>
            New Client
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-fadeIn">
          <i className="fa-solid fa-circle-info"></i>
          {syncMsg}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Client Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Address</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <i className="fa-solid fa-users-slash text-4xl mb-3 block"></i>
                    {searchTerm ? 'No matching clients.' : 'No clients predefined yet.'}
                  </td>
                </tr>
              ) : filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm">{client.name}</div>
                    <div className="text-xs text-slate-500">{client.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 text-sm">{client.phone || '-'}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs max-w-[200px] truncate" title={client.address}>{client.address || '-'}</td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(client)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button onClick={() => deleteClient(client.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <i className="fa-solid fa-trash"></i>
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">{editingId ? 'Edit' : 'Create'} Client</h2>
              <button onClick={() => resetForm()} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input 
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone (Optional)</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                    placeholder="+1 234 ..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Physical Address</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm min-h-[80px]" 
                  placeholder="Street, City, Postcode..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => resetForm()} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 text-sm">
                  {editingId ? 'Update Client' : 'Save Client'}
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