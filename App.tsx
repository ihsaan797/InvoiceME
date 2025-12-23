import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import TransactionManager from './components/TransactionManager';
import CatalogManager from './components/CatalogManager';
import ClientManager from './components/ClientManager';
import Settings from './components/Settings';
import { AppState, DocumentType, TransactionType, Document, Transaction, CatalogItem, Client } from './types';

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
    paymentDetails: 'Bank: Bank of Maldives (BML)\nAccount Name: SANDPIX MALDIVES\nAccount Number: 7730000000001\nBranch: Main Branch'
  },
  documents: [],
  transactions: [],
  catalog: [],
  clients: []
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('bizflow_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrations
      if (!parsed.catalog) parsed.catalog = [];
      if (!parsed.clients) parsed.clients = [];
      if (!parsed.business.invoicePrefix) parsed.business.invoicePrefix = 'INV';
      if (!parsed.business.quotationPrefix) parsed.business.quotationPrefix = 'QT';
      return parsed;
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem('bizflow_state', JSON.stringify(state));
  }, [state]);

  const updateBusiness = (business: AppState['business']) => {
    setState(prev => ({ ...prev, business }));
  };

  const addDocument = (doc: Document) => {
    setState(prev => ({ ...prev, documents: [doc, ...prev.documents] }));
  };

  const updateDocument = (doc: Document) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => d.id === doc.id ? doc : d)
    }));
  };

  const updateDocumentStatus = (id: string, status: 'Draft' | 'Sent' | 'Paid' | 'Expired') => {
      setState(prev => {
          const doc = prev.documents.find(d => d.id === id);
          if (!doc) return prev;

          let newTransactions = prev.transactions;
          if (doc.type === DocumentType.INVOICE && status === 'Paid' && doc.status !== 'Paid') {
              const subtotal = doc.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
              const taxAmount = (subtotal * prev.business.taxPercentage) / 100;
              const total = subtotal + taxAmount;

              const newSale: Transaction = {
                  id: `sale-inv-${doc.id}-${Date.now()}`,
                  type: TransactionType.SALE,
                  date: new Date().toISOString().split('T')[0],
                  category: 'Product Sales',
                  amount: total,
                  description: `Payment for Invoice ${doc.number}`,
                  reference: doc.number
              };
              newTransactions = [newSale, ...prev.transactions];
          }

          return {
              ...prev,
              documents: prev.documents.map(d => d.id === id ? { ...d, status } : d),
              transactions: newTransactions
          };
      });
  };

  const deleteDocument = (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
  };

  const addTransaction = (tx: Transaction) => {
    setState(prev => ({ ...prev, transactions: [tx, ...prev.transactions] }));
  };

  const deleteTransaction = (id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  };

  const addCatalogItem = (item: CatalogItem) => {
    setState(prev => ({ ...prev, catalog: [item, ...prev.catalog] }));
  };

  const updateCatalogItem = (item: CatalogItem) => {
    setState(prev => ({
      ...prev,
      catalog: prev.catalog.map(i => i.id === item.id ? item : i)
    }));
  };

  const deleteCatalogItem = (id: string) => {
    setState(prev => ({ ...prev, catalog: prev.catalog.filter(i => i.id !== id) }));
  };

  const addClient = (client: Client) => {
    setState(prev => ({ ...prev, clients: [client, ...prev.clients] }));
  };

  const addClients = (newClients: Client[]) => {
    setState(prev => ({ ...prev, clients: [...newClients, ...prev.clients] }));
  };

  const updateClient = (client: Client) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === client.id ? client : c)
    }));
  };

  const deleteClient = (id: string) => {
    setState(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
  };

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 overflow-hidden relative">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
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
              aria-label="Open menu"
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