import React, { useState, useMemo } from 'react';
import { AppState, CatalogItem } from '../types';

interface Props {
  state: AppState;
  addItem: (item: CatalogItem) => void;
  updateItem: (item: CatalogItem) => void;
  deleteItem: (id: string) => void;
}

const CatalogManager: React.FC<Props> = ({ state, addItem, updateItem, deleteItem }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    unitPrice: 0
  });

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return state.catalog;
    const term = searchTerm.toLowerCase();
    return state.catalog.filter(i => 
      i.description.toLowerCase().includes(term)
    );
  }, [state.catalog, searchTerm]);

  const resetForm = () => {
    setFormData({ description: '', unitPrice: 0 });
    setEditingId(null);
    setShowModal(false);
  };

  const handleEdit = (item: CatalogItem) => {
    setFormData({
      description: item.description,
      unitPrice: item.unitPrice
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateItem({ id: editingId, ...formData });
    } else {
      addItem({ id: Date.now().toString(), ...formData });
    }
    resetForm();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Item Catalog</h1>
          <p className="text-sm text-slate-500">Manage your products and services.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder="Search catalog..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-black transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm"
          >
            <i className="fa-solid fa-plus"></i>
            New Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Standard Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                    <i className="fa-solid fa-box-open text-4xl mb-3 block"></i>
                    {searchTerm ? 'No matches.' : 'Catalog is empty.'}
                  </td>
                </tr>
              ) : filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-800 text-sm">{item.description}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                    {state.business.currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">{editingId ? 'Edit' : 'Create'} Item</h2>
              <button onClick={() => resetForm()} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Item Description</label>
                <input 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                  placeholder="Service or product name..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Unit Price ({state.business.currency})</label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => resetForm()} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 text-sm">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 text-sm">
                  {editingId ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManager;