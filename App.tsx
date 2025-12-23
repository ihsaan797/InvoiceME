
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import TransactionManager from './components/TransactionManager';
import CatalogManager from './components/CatalogManager';
import ClientManager from './components/ClientManager';
import Settings from './components/Settings';
import { AppState, DocumentType, TransactionType, Document, Transaction, CatalogItem, Client, BusinessDetails } from './types';
import { supabase } from './lib/supabase';

const INITIAL_STATE: AppState = {
  business: {
    name: 'SANDPIX MALDIVES',
    email: 'info@sandpixmaldives.com',
    phone: '+960 797 3617',
    address: 'Blue House, HDh. Nellaidhoo, Maldives',
    tinNumber: '1106645GST501',
    currency: 'MVR',
    taxPercentage: 8,
    invoicePrefix: 'INV',
    quotationPrefix: 'QT',
    defaultTerms: '1. Please pay within 7 days.\n2. Goods once sold are not returnable.',
    defaultPaymentTerms: 'Net 7 Days',
    paymentDetails: 'Bank: Bank of Maldives (BML)\nAccount Name: SANDPIX MALDIVES\nAccount Number: 7730000000001\nBranch: Main Branch',
    poweredByText: 'SANDPIX MALDIVES'
  },
  documents: [],
  transactions: [],
  catalog: [],
  clients: []
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  // Initial Data Fetch from Supabase
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: businessData, error: bizError },
          { data: docsData },
          { data: txsData },
          { data: catalogData },
          { data: clientsData }
        ] = await Promise.all([
          supabase.from('business_settings').select('*').eq('id', 1).maybeSingle(),
          supabase.from('documents').select('*').order('created_at', { ascending: false }),
          supabase.from('transactions').select('*').order('created_at', { ascending: false }),
          supabase.from('catalog_items').select('*').order('created_at', { ascending: false }),
          supabase.from('clients').select('*').order('created_at', { ascending: false })
        ]);

        // If no business data found (first time), try to insert initial data
        let activeBusiness = businessData || INITIAL_STATE.business;
        if (!businessData && !bizError) {
           const { data: inserted } = await supabase.from('business_settings').insert({ id: 1, ...INITIAL_STATE.business }).select().single();
           if (inserted) activeBusiness = inserted;
        }

        setState({
          business: activeBusiness,
          documents: docsData || [],
          transactions: txsData || [],
          catalog: catalogData || [],
          clients: clientsData || []
        });
      } catch (err) {
        console.error("Failed to fetch data from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const updateBusiness = async (business: BusinessDetails) => {
    // 1. Update UI state immediately for responsiveness
    setState(prev => ({ ...prev, business }));
    
    // 2. Persist to Supabase using id:1 to ensure only one profile exists
    const { error } = await supabase
      .from('business_settings')
      .upsert({ id: 1, ...business });
    
    if (error) {
      console.error("Error updating business settings:", error);
      alert(`Sync Error: ${error.message}. Ensure your database schema matches.`);
    }
  };

  const addDocument = async (doc: Document) => {
    setState(prev => ({ ...prev, documents: [doc, ...prev.documents] }));
    await supabase.from('documents').insert(doc);
  };

  const updateDocument = async (doc: Document) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === doc.id ? doc : d)
    }));
    await supabase.from('documents').update(doc).eq('id', doc.id);
  };

  const updateDocumentStatus = async (id: string, status: 'Draft' | 'Sent' | 'Paid' | 'Expired') => {
      const doc = state.documents.find(d => d.id === id);
      if (!doc) return;

      let newTransaction: Transaction | null = null;
      if (doc.type === DocumentType.INVOICE && status === 'Paid' && doc.status !== 'Paid') {
          const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
          const taxAmount = (subtotal * state.business.taxPercentage) / 100;
          const total = subtotal + taxAmount;

          newTransaction = {
              id: `sale-inv-${doc.id}-${Date.now()}`,
              type: TransactionType.SALE,
              date: new Date().toISOString().split('T')[0],
              category: 'Product Sales',
              amount: total,
              description: `Payment for Invoice ${doc.number}`,
              reference: doc.number
          };
      }

      setState(prev => ({
          ...prev,
          documents: prev.documents.map(d => d.id === id ? { ...d, status } : d),
          transactions: newTransaction ? [newTransaction, ...prev.transactions] : prev.transactions
      }));

      await supabase.from('documents').update({ status }).eq('id', id);
      if (newTransaction) {
          await supabase.from('transactions').insert(newTransaction);
      }
  };

  const deleteDocument = async (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
    await supabase.from('documents').delete().eq('id', id);
  };

  const addTransaction = async (tx: Transaction) => {
    setState(prev => ({ ...prev, transactions: [tx, ...prev.transactions] }));
    await supabase.from('transactions').insert(tx);
  };

  const deleteTransaction = async (id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    await supabase.from('transactions').delete().eq('id', id);
  };

  const addCatalogItem = async (item: CatalogItem) => {
    setState(prev => ({ ...prev, catalog: [item, ...prev.catalog] }));
    await supabase.from('catalog_items').insert(item);
  };

  const updateCatalogItem = async (item: CatalogItem) => {
    setState(prev => ({
      ...prev,
      catalog: prev.catalog.map(i => i.id === item.id ? item : i)
    }));
    await supabase.from('catalog_items').update(item).eq('id', item.id);
  };

  const deleteCatalogItem = async (id: string) => {
    setState(prev => ({ ...prev, catalog: prev.catalog.filter(i => i.id !== id) }));
    await supabase.from('catalog_items').delete().eq('id', id);
  };

  const addClient = async (client: Client) => {
    setState(prev => ({ ...prev, clients: [client, ...prev.clients] }));
    await supabase.from('clients').insert(client);
  };

  const addClients = async (newClients: Client[]) => {
    setState(prev => ({ ...prev, clients: [...newClients, ...prev.clients] }));
    await supabase.from('clients').insert(newClients);
  };

  const updateClient = async (client: Client) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === client.id ? client : c)
    }));
    await supabase.from('clients').update(client).eq('id', client.id);
  };

  const deleteClient = async (id: string) => {
    setState(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
    await supabase.from('clients').delete().eq('id', id);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-blue-600 p-3 rounded-2xl text-white animate-bounce mb-4">
          <i className="fa-solid fa-bolt text-3xl"></i>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Syncing with Supabase...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} business={state.business} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <i className="fa-solid fa-bolt text-xs"></i>
              </div>
              <h1 className="font-bold text-slate-900 tracking-tight">Invoice ME</h1>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Routes>
              <Route path="/" element={<Dashboard state={state} />} />
              <Route 
                path="/quotations" 
                element={<DocumentManager 
                  type={DocumentType.QUOTATION} 
                  state={state} 
                  addDocument={addDocument}
                  updateDocument={updateDocument}
                  deleteDocument={deleteDocument}
                  updateStatus={updateDocumentStatus}
                  addClient={addClient}
                />} 
              />
              <Route 
                path="/invoices" 
                element={<DocumentManager 
                  type={DocumentType.INVOICE} 
                  state={state} 
                  addDocument={addDocument}
                  updateDocument={updateDocument}
                  deleteDocument={deleteDocument}
                  updateStatus={updateDocumentStatus}
                  addClient={addClient}
                />} 
              />
              <Route 
                path="/clients" 
                element={<ClientManager 
                  state={state} 
                  addClient={addClient}
                  addClients={addClients}
                  updateClient={updateClient}
                  deleteClient={deleteClient}
                />} 
              />
              <Route 
                path="/catalog" 
                element={<CatalogManager 
                  state={state} 
                  addItem={addCatalogItem}
                  updateItem={updateCatalogItem}
                  deleteItem={deleteCatalogItem}
                />} 
              />
              <Route 
                path="/sales" 
                element={<TransactionManager 
                  type={TransactionType.SALE} 
                  state={state} 
                  addTransaction={addTransaction} 
                  deleteTransaction={deleteTransaction}
                />} 
              />
              <Route 
                path="/expenses" 
                element={<TransactionManager 
                  type={TransactionType.EXPENSE} 
                  state={state} 
                  addTransaction={addTransaction} 
                  deleteTransaction={deleteTransaction}
                />} 
              />
              <Route 
                path="/settings" 
                element={<Settings business={state.business} updateBusiness={updateBusiness} />} 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
