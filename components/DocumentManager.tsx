import React, { useState, useMemo } from 'react';
// Import Link from react-router-dom to fix the 'Cannot find name Link' error
import { Link } from 'react-router-dom';
import { AppState, Document, DocumentType, LineItem, CatalogItem, Client } from '../types';
import { generatePDF } from '../utils/pdfGenerator';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  type: DocumentType;
  state: AppState;
  addDocument: (doc: Document) => void;
  updateDocument: (doc: Document) => void;
  deleteDocument: (id: string) => void;
  updateStatus: (id: string, status: any) => void;
  addClient: (client: Client) => void;
}

const DocumentManager: React.FC<Props> = ({ type, state, addDocument, updateDocument, deleteDocument, updateStatus, addClient }) => {
  const [showModal, setShowModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [loadingSmart, setLoadingSmart] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveClientStatus, setSaveClientStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: state.business.defaultTerms || '',
    items: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }] as LineItem[]
  });

  const filteredDocs = useMemo(() => {
    const docs = state.documents.filter(d => d.type === type);
    if (!searchTerm.trim()) return docs;
    
    const term = searchTerm.toLowerCase();
    return docs.filter(d => 
      d.number.toLowerCase().includes(term) ||
      d.clientName.toLowerCase().includes(term) ||
      d.clientEmail.toLowerCase().includes(term)
    );
  }, [state.documents, type, searchTerm]);

  const filteredCatalog = useMemo(() => {
    if (!catalogSearchTerm.trim()) return state.catalog;
    const term = catalogSearchTerm.toLowerCase();
    return state.catalog.filter(item => 
      item.description.toLowerCase().includes(term)
    );
  }, [state.catalog, catalogSearchTerm]);

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm.trim()) return state.clients;
    const term = clientSearchTerm.toLowerCase();
    return state.clients.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term)
    );
  }, [state.clients, clientSearchTerm]);

  const currentSubtotal = useMemo(() => {
    return formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  }, [formData.items]);

  const currentTaxAmount = useMemo(() => {
    return (currentSubtotal * state.business.taxPercentage) / 100;
  }, [currentSubtotal, state.business.taxPercentage]);

  const currentTotal = currentSubtotal + currentTaxAmount;

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('-').reverse().join('-');
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: state.business.defaultTerms || '',
      items: [{ id: '1', description: '', quantity: 1, unitPrice: 0 }]
    });
    setEditingDocId(null);
    setShowModal(false);
    setSaveClientStatus(null);
  };

  const handleEdit = (doc: Document) => {
    setFormData({
      clientName: doc.clientName,
      clientEmail: doc.clientEmail,
      date: doc.date,
      dueDate: doc.dueDate,
      notes: doc.notes || '',
      items: doc.items.map(item => ({ ...item }))
    });
    setEditingDocId(doc.id);
    setShowModal(true);
    setSaveClientStatus(null);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const handleAddFromCatalog = (catalogItem: CatalogItem) => {
    const newItem: LineItem = {
      id: Date.now().toString() + Math.random(),
      description: catalogItem.description,
      quantity: 1,
      unitPrice: catalogItem.unitPrice
    };

    setFormData(prev => {
      // If the first item is empty, replace it
      if (prev.items.length === 1 && !prev.items[0].description && prev.items[0].unitPrice === 0) {
        return { ...prev, items: [newItem] };
      }
      return { ...prev, items: [...prev.items, newItem] };
    });
    setShowCatalogModal(false);
    setCatalogSearchTerm('');
  };

  const handleSelectClient = (client: Client) => {
    setFormData(prev => ({
      ...prev,
      clientName: client.name,
      clientEmail: client.email
    }));
    setShowClientModal(false);
    setClientSearchTerm('');
  };

  const handleSaveToPredefined = () => {
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      setSaveClientStatus({ type: 'error', message: 'Name and email are required to save.' });
      return;
    }

    const isDuplicate = state.clients.some(c => 
      c.name.toLowerCase() === formData.clientName.toLowerCase() || 
      c.email.toLowerCase() === formData.clientEmail.toLowerCase()
    );

    if (isDuplicate) {
      setSaveClientStatus({ type: 'error', message: 'This client already exists in predefined list.' });
    } else {
      addClient({
        id: `manual-${Date.now()}`,
        name: formData.clientName,
        email: formData.clientEmail,
        phone: '',
        address: ''
      });
      setSaveClientStatus({ type: 'success', message: 'Client saved to predefined list!' });
    }

    setTimeout(() => setSaveClientStatus(null), 3000);
  };

  const handleRemoveItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDocId) {
      const existingDoc = state.documents.find(d => d.id === editingDocId);
      if (existingDoc) {
        const updatedDoc: Document = {
          ...existingDoc,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          date: formData.date,
          dueDate: formData.dueDate,
          items: formData.items,
          notes: formData.notes
        };
        updateDocument(updatedDoc);
      }
    } else {
      const prefix = type === DocumentType.QUOTATION ? state.business.quotationPrefix : state.business.invoicePrefix;
      const newDoc: Document = {
        id: Date.now().toString(),
        type,
        number: `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        date: formData.date,
        dueDate: formData.dueDate,
        items: formData.items,
        status: 'Draft',
        notes: formData.notes
      };
      addDocument(newDoc);
    }
    resetForm();
  };

  const handleSmartGenerate = async () => {
    setLoadingSmart(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Generate 3 professional service line items for a business in the ${state.business.name} industry.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            unitPrice: { type: Type.NUMBER }
                        },
                        required: ['description', 'unitPrice']
                    }
                }
            }
        });
        const items = JSON.parse(response.text || '[]');
        setFormData(prev => ({
            ...prev,
            items: items.map((it: any, idx: number) => ({
                id: `smart-${idx}-${Date.now()}`,
                description: it.description,
                quantity: 1,
                unitPrice: it.unitPrice
            }))
        }));
    } catch (err) {
        console.error("AI Error:", err);
    } finally {
        setLoadingSmart(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Search and Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{type === DocumentType.QUOTATION ? 'Quotations' : 'Invoices'}</h1>
          <p className="text-sm text-slate-500">Manage your business documents here.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
            <div className="relative flex-1 md:w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                />
            </div>
            <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
                <i className="fa-solid fa-plus"></i>
                New {type === DocumentType.QUOTATION ? 'Quotation' : 'Invoice'}
            </button>
        </div>
      </div>

      {/* Main Table Wrapper for Horizontal Scroll */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Client</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-600 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <i className="fa-solid fa-folder-open text-4xl mb-3 block"></i>
                          No records found.
                      </td>
                  </tr>
              ) : filteredDocs.map(doc => {
                const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
                const total = subtotal + (subtotal * state.business.taxPercentage / 100);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{doc.number}</span>
                        {doc.status === 'Paid' && (
                          <i className="fa-solid fa-circle-check text-emerald-500 text-xs" title="Paid"></i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{doc.clientName}</div>
                      <div className="text-xs text-slate-500">{doc.clientEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{formatDateDisplay(doc.date)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{state.business.currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        doc.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' :
                        doc.status === 'Sent' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap space-x-1">
                      <button onClick={() => handleEdit(doc)} title="Edit" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                      <button onClick={() => generatePDF(doc, state.business, true)} title="View PDF" className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button onClick={() => generatePDF(doc, state.business, false)} title="Download PDF" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <i className="fa-solid fa-download"></i>
                      </button>
                      {type === DocumentType.INVOICE && doc.status !== 'Paid' && (
                        <button onClick={() => updateStatus(doc.id, 'Paid')} title="Mark as Paid" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}
                      <button onClick={() => deleteDocument(doc.id)} title="Delete" className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Document Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-2xl w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                {editingDocId ? 'Edit' : 'Create New'} {type === DocumentType.QUOTATION ? 'Quotation' : 'Invoice'}
              </h2>
              <button onClick={() => resetForm()} className="text-slate-400 hover:text-slate-600 p-2">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 md:space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-700">Client Name</label>
                        <div className="flex gap-3">
                          <button 
                              type="button" 
                              onClick={() => { setClientSearchTerm(''); setShowClientModal(true); }}
                              className="text-blue-600 text-[10px] md:text-xs font-bold hover:underline flex items-center gap-1"
                          >
                              <i className="fa-solid fa-address-book"></i>
                              Browse Predefined
                          </button>
                          <button 
                              type="button" 
                              onClick={handleSaveToPredefined}
                              className="text-emerald-600 text-[10px] md:text-xs font-bold hover:underline flex items-center gap-1"
                              title="Save these details as a predefined client"
                          >
                              <i className="fa-solid fa-user-plus"></i>
                              Save as Predefined
                          </button>
                        </div>
                    </div>
                    {saveClientStatus && (
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-lg animate-fadeIn ${saveClientStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {saveClientStatus.message}
                      </div>
                    )}
                    <input required value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900" placeholder="Enter client name or select..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Client Email</label>
                    <input required type="email" value={formData.clientEmail} onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900" placeholder="client@example.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                    <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-800">Line Items</h3>
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => { setCatalogSearchTerm(''); setShowCatalogModal(true); }}
                            className="text-slate-600 text-xs md:text-sm font-semibold hover:underline flex items-center gap-1"
                        >
                            <i className="fa-solid fa-boxes-stacked"></i>
                            Browse Catalog
                        </button>
                        <button 
                            type="button"
                            disabled={loadingSmart}
                            onClick={handleSmartGenerate}
                            className="text-blue-600 text-xs md:text-sm font-semibold hover:underline flex items-center gap-1"
                        >
                            <i className={`fa-solid ${loadingSmart ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                            {loadingSmart ? 'Thinking...' : 'AI Suggest'}
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 md:flex-row md:gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex-1 w-full">
                        <input placeholder="Description" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" />
                      </div>
                      <div className="flex w-full md:w-auto gap-3">
                        <div className="flex-1 md:w-20">
                          <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" />
                        </div>
                        <div className="flex-[2] md:w-32">
                          <input type="number" placeholder="Price" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" />
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 pt-4">
                  <button type="button" onClick={handleAddItem} className="flex-1 w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-slate-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-all text-sm">
                    <i className="fa-solid fa-plus mr-2"></i>Add Another Item
                  </button>

                  <div className="w-full lg:w-72 bg-slate-900 text-white rounded-2xl p-5 md:p-6 shadow-xl space-y-3">
                    <div className="flex justify-between items-center text-xs md:text-sm text-slate-400">
                      <span>Subtotal</span>
                      <span>{state.business.currency} {currentSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs md:text-sm text-slate-400">
                      <span>Tax ({state.business.taxPercentage}%)</span>
                      <span>{state.business.currency} {currentTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</span>
                      <span className="text-xl md:text-2xl font-black">{state.business.currency} {currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 border-t border-slate-100 pt-6">
                <button type="button" onClick={() => resetForm()} className="px-6 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 text-sm">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 text-sm">
                  {editingDocId ? 'Update Document' : 'Save & Generate'}
                </button>
              </div>
            </form>

            {/* Catalog Browser Overlay Modal */}
            {showCatalogModal && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-30 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[80vh]">
                        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="text-lg md:text-xl font-bold text-slate-900">Select Item</h3>
                            <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                          <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input 
                              autoFocus
                              type="text" 
                              placeholder="Search catalog items..."
                              value={catalogSearchTerm}
                              onChange={(e) => setCatalogSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white">
                            {state.catalog.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <p className="mb-4 text-sm">No items in your catalog yet.</p>
                                    <Link to="/catalog" className="text-blue-600 font-bold hover:underline" onClick={() => setShowCatalogModal(false)}>
                                        Go to Catalog Manager
                                    </Link>
                                </div>
                            ) : filteredCatalog.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 text-sm">
                                    <p>No matches for "{catalogSearchTerm}"</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredCatalog.map(item => (
                                        <button 
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleAddFromCatalog(item)}
                                            className="w-full text-left p-4 hover:bg-blue-50 transition-colors group flex justify-between items-center"
                                        >
                                            <div className="min-w-0 flex-1 pr-4">
                                                <div className="font-semibold text-slate-800 group-hover:text-blue-700 truncate text-sm">{item.description}</div>
                                                <div className="text-xs text-slate-500">{state.business.currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            </div>
                                            <i className="fa-solid fa-plus text-slate-300 group-hover:text-blue-500"></i>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Client Browser Overlay Modal */}
            {showClientModal && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-30 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[80vh]">
                        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h3 className="text-lg md:text-xl font-bold text-slate-900">Select Client</h3>
                            <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600 p-2">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        
                        <div className="p-4 bg-slate-50 border-b border-slate-100">
                          <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input 
                              autoFocus
                              type="text" 
                              placeholder="Search predefined clients..."
                              value={clientSearchTerm}
                              onChange={(e) => setClientSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-white">
                            {state.clients.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <p className="mb-4 text-sm">No predefined clients found.</p>
                                    <Link to="/clients" className="text-blue-600 font-bold hover:underline" onClick={() => setShowClientModal(false)}>
                                        Go to Client Manager
                                    </Link>
                                </div>
                            ) : filteredClients.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 text-sm">
                                    <p>No matches for "{clientSearchTerm}"</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredClients.map(client => (
                                        <button 
                                            key={client.id}
                                            type="button"
                                            onClick={() => handleSelectClient(client)}
                                            className="w-full text-left p-4 hover:bg-emerald-50 transition-colors group flex justify-between items-center"
                                        >
                                            <div className="min-w-0 flex-1 pr-4">
                                                <div className="font-semibold text-slate-800 group-hover:text-emerald-700 truncate text-sm">{client.name}</div>
                                                <div className="text-xs text-slate-500">{client.email}</div>
                                            </div>
                                            <i className="fa-solid fa-user-check text-slate-300 group-hover:text-emerald-500"></i>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;