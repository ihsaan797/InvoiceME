import React, { useState, useMemo, useRef } from 'react';
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
  
  const notesRef = useRef<HTMLTextAreaElement>(null);

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
      (d.clientEmail && d.clientEmail.toLowerCase().includes(term))
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
      (c.email && c.email.toLowerCase().includes(term))
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
      clientEmail: doc.clientEmail || '',
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
      clientEmail: client.email || ''
    }));
    setShowClientModal(false);
    setClientSearchTerm('');
  };

  const handleFormat = (type: 'bold' | 'italic' | 'list') => {
    if (!notesRef.current) return;
    const start = notesRef.current.selectionStart;
    const end = notesRef.current.selectionEnd;
    const text = formData.notes || '';
    const selected = text.substring(start, end);

    let formatted = '';
    if (type === 'bold') formatted = `**${selected || 'bold text'}**`;
    else if (type === 'italic') formatted = `*${selected || 'italic text'}*`;
    else if (type === 'list') formatted = `\n- ${selected || 'list item'}`;

    const newVal = text.substring(0, start) + formatted + text.substring(end);
    setFormData({ ...formData, notes: newVal });

    setTimeout(() => {
      notesRef.current?.focus();
      notesRef.current?.setSelectionRange(start + 2, start + 2 + (selected.length || formatted.length - 4));
    }, 0);
  };

  const handleSaveToPredefined = () => {
    if (!formData.clientName.trim()) {
      setSaveClientStatus({ type: 'error', message: 'Name is required.' });
      return;
    }
    const isDuplicate = state.clients.some(c => 
      c.name.toLowerCase() === formData.clientName.toLowerCase() || 
      (formData.clientEmail.trim() !== '' && c.email?.toLowerCase() === formData.clientEmail.toLowerCase())
    );
    if (isDuplicate) {
      setSaveClientStatus({ type: 'error', message: 'Client already exists.' });
    } else {
      addClient({
        id: `manual-${Date.now()}`,
        name: formData.clientName,
        email: formData.clientEmail || undefined,
        phone: '',
        address: ''
      });
      setSaveClientStatus({ type: 'success', message: 'Client saved!' });
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
      const existingDoc = state.documents.find(d => String(d.id) === String(editingDocId));
      if (existingDoc) {
        const updatedDoc: Document = {
          ...existingDoc,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail || undefined,
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
        clientEmail: formData.clientEmail || undefined,
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
        const prompt = `Generate 3 professional service line items for a business in the ${state.business.name} industry. Return as JSON array of objects with description (string) and unitPrice (number).`;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Sent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Expired': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDocTypeIcon = () => type === DocumentType.QUOTATION ? 'fa-file-lines' : 'fa-file-invoice-dollar';

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`p-2 rounded-xl text-white ${type === DocumentType.QUOTATION ? 'bg-indigo-500' : 'bg-blue-600'}`}>
              <i className={`fa-solid ${getDocTypeIcon()} text-lg`}></i>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {type === DocumentType.QUOTATION ? 'Quotations' : 'Invoices'}
            </h1>
          </div>
          <p className="text-slate-500">Track and manage your {type === DocumentType.QUOTATION ? 'pricing quotes' : 'billing documents'} with ease.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3">
          <div className="relative flex-1 lg:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder={`Search ${type.toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className={`px-6 py-3 rounded-2xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm active:scale-95 ${
              type === DocumentType.QUOTATION ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'
            }`}
          >
            <i className="fa-solid fa-plus"></i>
            New {type === DocumentType.QUOTATION ? 'Quotation' : 'Invoice'}
          </button>
        </div>
      </div>

      {/* Grid of Documents */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center shadow-sm">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className={`fa-solid ${getDocTypeIcon()} text-4xl text-slate-200`}></i>
          </div>
          <h3 className="text-xl font-bold text-slate-900">No {type.toLowerCase()}s found</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            {searchTerm 
              ? `We couldn't find any results matching your search.` 
              : `Your ${type.toLowerCase()} list is empty. Start by creating a professional document for your clients.`}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => setShowModal(true)}
              className="mt-8 text-blue-600 font-bold hover:bg-blue-50 px-6 py-2 rounded-xl transition-colors"
            >
              Create Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredDocs.map(doc => {
            const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
            const total = subtotal + (subtotal * state.business.taxPercentage / 100);
            return (
              <div key={doc.id} className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors">{doc.number}</h3>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{formatDateDisplay(doc.date)}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl border ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</p>
                  <p className="font-bold text-slate-800 truncate">{doc.clientName}</p>
                  <p className="text-xs text-slate-500 truncate">{doc.clientEmail || 'No email provided'}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                      <p className="text-xl font-black text-slate-900">
                        {state.business.currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {doc.dueDate && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                        <p className={`text-xs font-bold ${new Date(doc.dueDate) < new Date() && doc.status !== 'Paid' ? 'text-rose-500' : 'text-slate-600'}`}>
                          {formatDateDisplay(doc.dueDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  <button onClick={() => handleEdit(doc)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                    <i className="fa-solid fa-pencil"></i> Edit
                  </button>
                  <button onClick={() => generatePDF(doc, state.business, true)} className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                    <i className="fa-solid fa-eye"></i> View
                  </button>
                  <div className="w-full flex gap-2">
                    <button onClick={() => generatePDF(doc, state.business, false)} className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                      <i className="fa-solid fa-download"></i> PDF
                    </button>
                    {type === DocumentType.INVOICE && doc.status !== 'Paid' && (
                      <button onClick={() => updateStatus(doc.id, 'Paid')} className="flex-1 bg-emerald-100 text-emerald-700 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2">
                        <i className="fa-solid fa-check"></i> Paid
                      </button>
                    )}
                    {type === DocumentType.QUOTATION && doc.status === 'Draft' && (
                      <button onClick={() => updateStatus(doc.id, 'Sent')} className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 border border-blue-200">
                        <i className="fa-solid fa-paper-plane"></i> Sent
                      </button>
                    )}
                    <button onClick={() => { if(window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) deleteDocument(doc.id); }} className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100">
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-6 overflow-hidden">
          <div className="bg-white rounded-none md:rounded-3xl w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] shadow-2xl overflow-hidden animate-slideUp flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${type === DocumentType.QUOTATION ? 'bg-indigo-500' : 'bg-blue-600'}`}>
                   <i className={`fa-solid ${getDocTypeIcon()} text-xl`}></i>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    {editingDocId ? 'Update' : 'New'} {type === DocumentType.QUOTATION ? 'Quotation' : 'Invoice'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Step through to generate your professional PDF.</p>
                </div>
              </div>
              <button onClick={() => resetForm()} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-slate-50 rounded-xl transition-all">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 md:p-8 space-y-10 custom-scrollbar">
              
              {/* Client & Metadata Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Client Details</h3>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => { setClientSearchTerm(''); setShowClientModal(true); }} className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1.5">
                        <i className="fa-solid fa-address-book"></i> Browse Predefined
                      </button>
                      <button type="button" onClick={handleSaveToPredefined} className="text-emerald-600 text-xs font-bold hover:underline flex items-center gap-1.5">
                        <i className="fa-solid fa-user-plus"></i> Quick Save
                      </button>
                    </div>
                  </div>
                  {saveClientStatus && (
                    <div className={`text-xs font-bold px-3 py-2 rounded-xl animate-fadeIn flex items-center gap-2 ${saveClientStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      <i className={`fa-solid ${saveClientStatus.type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation'}`}></i>
                      {saveClientStatus.message}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Client Name / Business</label>
                      <input required value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 text-sm font-medium" placeholder="Who is this for?" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email Address (Optional)</label>
                      <input type="email" value={formData.clientEmail} onChange={(e) => setFormData({...formData, clientEmail: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 text-sm font-medium" placeholder="client@example.com" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3 mb-2">Document Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Issue Date</label>
                      <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 text-sm font-medium" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Due Date</label>
                      <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 text-sm font-medium" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Line Items</h3>
                  <div className="flex flex-wrap gap-4">
                    <button type="button" onClick={() => { setCatalogSearchTerm(''); setShowCatalogModal(true); }} className="text-slate-600 text-xs font-bold hover:underline flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl transition-colors">
                      <i className="fa-solid fa-boxes-stacked"></i> Catalog
                    </button>
                    <button type="button" disabled={loadingSmart} onClick={handleSmartGenerate} className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1.5 px-3 py-2 bg-blue-50 rounded-xl transition-colors disabled:opacity-50">
                      <i className={`fa-solid ${loadingSmart ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i> {loadingSmart ? 'Thinking...' : 'AI Suggest'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="flex flex-col lg:flex-row gap-4 items-start bg-slate-50 p-6 rounded-3xl border border-slate-100 group/item relative">
                      <div className="flex-1 w-full space-y-2">
                         <label className="lg:hidden text-[10px] font-black uppercase text-slate-400">Description</label>
                         <input placeholder="Service description or product name..." value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-medium shadow-sm" />
                      </div>
                      <div className="flex w-full lg:w-auto gap-4">
                        <div className="flex-1 lg:w-24 space-y-2">
                          <label className="lg:hidden text-[10px] font-black uppercase text-slate-400">Qty</label>
                          <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-medium shadow-sm text-center" />
                        </div>
                        <div className="flex-[2] lg:w-36 space-y-2">
                          <label className="lg:hidden text-[10px] font-black uppercase text-slate-400">Price</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{state.business.currency}</span>
                            <input type="number" placeholder="0.00" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-medium shadow-sm" />
                          </div>
                        </div>
                        <div className="hidden lg:flex flex-col items-end justify-center w-32 space-y-1">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Line Total</span>
                           <span className="font-bold text-slate-900 text-sm">
                             {(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </span>
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-3.5 text-slate-300 hover:text-rose-500 transition-colors bg-white lg:bg-transparent rounded-2xl lg:rounded-none shadow-sm lg:shadow-none">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={handleAddItem} className="w-full border-2 border-dashed border-slate-200 rounded-3xl py-6 text-slate-400 font-black uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all text-xs flex items-center justify-center gap-3">
                    <i className="fa-solid fa-plus-circle text-lg"></i> Add Line Item
                  </button>
                </div>
              </div>

              {/* Summary & Footer Notes Section */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 pt-4 pb-10">
                <div className="lg:col-span-3 space-y-6">
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-600 pl-3">Terms and Conditions</h3>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleFormat('bold')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" title="Bold">
                            <i className="fa-solid fa-bold text-xs"></i>
                          </button>
                          <button type="button" onClick={() => handleFormat('italic')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" title="Italic">
                            <i className="fa-solid fa-italic text-xs"></i>
                          </button>
                          <button type="button" onClick={() => handleFormat('list')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" title="List Item">
                            <i className="fa-solid fa-list-ul text-xs"></i>
                          </button>
                        </div>
                    </div>
                    <textarea ref={notesRef} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm font-medium min-h-[160px] resize-none transition-all" placeholder="Enter standard terms, bank details, or specific notes for this client..." />
                  </div>
                </div>
                
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-receipt text-9xl"></i>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                        <span className="font-bold">{state.business.currency} {currentSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Tax ({state.business.taxPercentage}%)</span>
                        <span className="font-bold">{state.business.currency} {currentTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-6 border-t border-slate-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Grand Total</span>
                          <div className="text-right">
                             <p className="text-3xl font-black">{state.business.currency} {currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-medium italic">Calculated automatically based on your regional tax settings ({state.business.taxPercentage}%)</p>
                </div>
              </div>
            </form>

            {/* Modal Actions */}
            <div className="p-6 md:p-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4 bg-slate-50 shrink-0">
              <button type="button" onClick={() => resetForm()} className="px-8 py-4 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-slate-900 transition-all text-[10px]">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.15em] shadow-xl shadow-slate-200 hover:bg-black transition-all text-[10px] flex items-center justify-center gap-3 active:scale-95">
                <i className="fa-solid fa-file-export"></i>
                {editingDocId ? 'Update Document' : 'Generate & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helper Modal: Catalog Browser */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Item Catalog</h3>
              <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input autoFocus type="text" placeholder="Search catalog items..." value={catalogSearchTerm} onChange={(e) => setCatalogSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                {filteredCatalog.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 italic">No items found in your catalog.</p>
                ) : filteredCatalog.map(item => (
                  <button key={item.id} type="button" onClick={() => handleAddFromCatalog(item)} className="w-full text-left p-4 rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all flex justify-between items-center group">
                    <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors">{item.description}</span>
                    <span className="font-black text-slate-900">{state.business.currency} {item.unitPrice.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper Modal: Client Browser */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Client Database</h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input autoFocus type="text" placeholder="Search saved clients..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
                {filteredClients.length === 0 ? (
                  <p className="text-center py-10 text-slate-400 italic">No clients found in your database.</p>
                ) : filteredClients.map(c => (
                  <button key={c.id} type="button" onClick={() => handleSelectClient(c)} className="w-full text-left p-4 rounded-2xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all flex flex-col group">
                    <span className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.email || 'No email saved'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;