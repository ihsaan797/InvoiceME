import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentManager from './components/DocumentManager';
import TransactionManager from './components/TransactionManager';
import CatalogManager from './components/CatalogManager';
import ClientManager from './components/ClientManager';
import Settings from './components/Settings';
import UserManager from './components/UserManager';
import Login from './components/Login';
import { AppState, DocumentType, TransactionType, Document, Transaction, CatalogItem, Client, BusinessDetails, User } from './types';
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
    paymentDetails: 'Bank: Bank of Maldives (BML)\nAccount Name: SANDPIX MALDIVES\nAccount Number: 7730000000001\nBranch: Main Branch',
    poweredByText: 'SANDPIX MALDIVES'
  },
  documents: [],
  transactions: [],
  catalog: [],
  clients: [],
  users: []
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
          { data: clientsData },
          { data: usersData }
        ] = await Promise.all([
          supabase.from('business_settings').select('*').eq('id', 1).maybeSingle(),
          supabase.from('documents').select('*').order('created_at', { ascending: false }),
          supabase.from('transactions').select('*').order('created_at', { ascending: false }),
          supabase.from('catalog_items').select('*').order('created_at', { ascending: false }),
          supabase.from('clients').select('*').order('created_at', { ascending: false }),
          supabase.from('users').select('*').order('created_at', { ascending: false })
        ]);

        let activeBusiness = businessData ? { ...INITIAL_STATE.business, ...businessData } : INITIAL_STATE.business;
        
        if (!businessData && !bizError) {
           const { data: inserted } = await supabase.from('business_settings').insert({ id: 1, ...INITIAL_STATE.business }).select().single();
           if (inserted) activeBusiness = { ...INITIAL_STATE.business, ...inserted };
        }

        // Initialize default admin if no users exist
        let allUsers = (usersData || []) as User[];
        if (allUsers.length === 0) {
          const defaultAdmin = { username: 'Ihsaan', password: 'password123', role: 'admin' as const, name: 'Ihsaan', isEnabled: true };
          const { data: insertedUser } = await supabase.from('users').insert(defaultAdmin).select().single();
          if (insertedUser) allUsers = [insertedUser as User];
        }

        setState({
          business: activeBusiness,
          documents: (docsData || []).map(d => ({ ...d, id: String(d.id) })),
          transactions: (txsData || []).map(t => ({ ...t, id: String(t.id) })),
          catalog: (catalogData || []).map(i => ({ ...i, id: String(i.id) })),
          clients: (clientsData || []).map(c => ({ ...c, id: String(c.id) })),
          users: allUsers.map(u => ({ ...u, id: String(u.id), isEnabled: u.isEnabled ?? true }))
        });

        // Check session
        const savedUser = sessionStorage.getItem('ledger_user');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }

      } catch (err) {
        console.error("Failed to fetch data from Supabase:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('ledger_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('ledger_user');
  };

  const updateBusiness = async (business: BusinessDetails) => {
    setState(prev => ({ ...prev, business }));
    try {
        await supabase.from('business_settings').upsert({ id: 1, ...business });
    } catch (err) {
        console.error("Critical Sync Error:", err);
    }
  };

  const addDocument = async (doc: Document) => {
    const tempId = doc.id;
    setState(prev => ({ ...prev, documents: [doc, ...prev.documents] }));
    try {
        const { id, ...docData } = doc;
        const { data } = await supabase.from('documents').insert(docData).select().single();
        if (data) {
            setState(prev => ({
                ...prev,
                documents: prev.documents.map(d => String(d.id) === String(tempId) ? { ...data, id: String(data.id) } : d)
            }));
        }
    } catch (err) {
        console.error("Add document failed:", err);
    }
  };

  const updateDocument = async (doc: Document) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.map(d => String(d.id) === String(doc.id) ? doc : d)
    }));
    await supabase.from('documents').update(doc).eq('id', doc.id);
  };

  const updateDocumentStatus = async (id: string, status: 'Draft' | 'Sent' | 'Paid' | 'Expired') => {
      const doc = state.documents.find(d => String(d.id) === String(id));
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
          documents: prev.documents.map(d => String(d.id) === String(id) ? { ...d, status } : d),
          transactions: newTransaction ? [newTransaction, ...prev.transactions] : prev.transactions
      }));

      await supabase.from('documents').update({ status }).eq('id', id);
      if (newTransaction) {
          const { id: txId, ...txData } = newTransaction;
          await supabase.from('transactions').insert(txData);
      }
  };

  const deleteDocument = async (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.filter(d => String(d.id) !== String(id)) }));
    await supabase.from('documents').delete().eq('id', id);
  };

  const addTransaction = async (tx: Transaction) => {
    const tempId = tx.id;
    setState(prev => ({ ...prev, transactions: [tx, ...prev.transactions] }));
    const { id, ...txData } = tx;
    const { data } = await supabase.from('transactions').insert(txData).select().single();
    if (data) {
        setState(prev => ({
            ...prev,
            transactions: prev.transactions.map(t => String(t.id) === String(tempId) ? { ...data, id: String(data.id) } : t)
        }));
    }
  };

  const deleteTransaction = async (id: string) => {
    setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => String(t.id) !== String(id)) }));
    await supabase.from('transactions').delete().eq('id', id);
  };

  const addCatalogItem = async (item: CatalogItem) => {
    const tempId = item.id;
    setState(prev => ({ ...prev, catalog: [item, ...prev.catalog] }));
    const { id, ...itemData } = item;
    const { data } = await supabase.from('catalog_items').insert(itemData).select().single();
    if (data) {
        setState(prev => ({
            ...prev,
            catalog: prev.catalog.map(i => String(i.id) === String(tempId) ? { ...data, id: String(data.id) } : i)
        }));
    }
  };

  const updateCatalogItem = async (item: CatalogItem) => {
    setState(prev => ({
      ...prev,
      catalog: prev.catalog.map(i => String(i.id) === String(item.id) ? item : i)
    }));
    await supabase.from('catalog_items').update(item).eq('id', item.id);
  };

  const deleteCatalogItem = async (id: string) => {
    setState(prev => ({ ...prev, catalog: prev.catalog.filter(i => String(i.id) !== String(id)) }));
    await supabase.from('catalog_items').delete().eq('id', id);
  };

  const addClient = async (client: Client) => {
    const tempId = client.id;
    setState(prev => ({ ...prev, clients: [client, ...prev.clients] }));
    const { id, ...clientData } = client;
    const { data } = await supabase.from('clients').insert(clientData).select().single();
    if (data) {
        setState(prev => ({
            ...prev,
            clients: prev.clients.map(c => String(c.id) === String(tempId) ? { ...data, id: String(data.id) } : c)
        }));
    }
  };

  const addClients = async (newClients: Client[]) => {
    setState(prev => ({ ...prev, clients: [...newClients, ...prev.clients] }));
    const formattedClients = newClients.map(({id, ...rest}) => rest);
    await supabase.from('clients').insert(formattedClients);
  };

  const updateClient = async (client: Client) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => String(c.id) === String(client.id) ? client : c)
    }));
    await supabase.from('clients').update(client).eq('id', client.id);
  };

  const deleteClient = async (id: string) => {
    setState(prev => ({ ...prev, clients: prev.clients.filter(c => String(c.id) !== String(id)) }));
    await supabase.from('clients').delete().eq('id', id);
  };

  const addUser = async (user: User) => {
    try {
      const { id: _, ...userData } = user;
      const { data, error } = await supabase.from('users').insert({ ...userData, isEnabled: userData.isEnabled ?? true }).select().single();
      
      if (error) throw error;
      
      if (data) {
          const newUser = { ...data, id: String(data.id), isEnabled: data.isEnabled ?? true } as User;
          setState(prev => ({ ...prev, users: [newUser, ...prev.users] }));
          return true;
      }
    } catch (err: any) {
      console.error("Supabase User Creation Error:", err.message);
      throw err;
    }
    return false;
  };

  const updateUser = async (user: User) => {
    try {
      const { id, ...userData } = user;
      const { error } = await supabase.from('users').update(userData).eq('id', id);
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => String(u.id) === String(id) ? user : u)
      }));
      return true;
    } catch (err: any) {
      console.error("Supabase User Update Error:", err.message);
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      // Robust deletion from state first for immediate UI feedback
      setState(prev => ({ ...prev, users: prev.users.filter(u => String(u.id) !== String(id)) }));
      
      // Ensure the ID is correctly parsed for the DB query if it's an integer column
      const dbId = isNaN(Number(id)) ? id : Number(id);
      const { error } = await supabase.from('users').delete().eq('id', dbId);
      
      if (error) {
        console.error("Supabase deletion error:", error);
        // Re-fetch users if deletion failed to restore state
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (data) {
            setState(prev => ({ ...prev, users: data.map(u => ({ ...u, id: String(u.id) })) }));
        }
      }
    } catch (err) {
      console.error("User deletion error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Synchronizing Ledger System...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login users={state.users} onLogin={handleLogin} poweredBy={state.business.poweredByText} />;
  }

  return (
    <HashRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          business={state.business} 
          currentUser={currentUser} 
          onLogout={handleLogout}
        />
        
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="md:hidden flex items-center justify-between p-6 bg-white border-b border-slate-100 shrink-0">
             <div className="flex items-center gap-3">
               <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <i className="fa-solid fa-bolt text-white text-sm"></i>
               </div>
               <h1 className="text-lg font-black tracking-tight">Invoice ME</h1>
             </div>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 hover:text-slate-900 transition-colors">
               <i className="fa-solid fa-bars-staggered text-xl"></i>
             </button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 lg:p-12">
            <Routes>
              <Route path="/" element={<Dashboard state={state} />} />
              <Route path="/quotations" element={
                <DocumentManager 
                  type={DocumentType.QUOTATION} 
                  state={state} 
                  addDocument={addDocument} 
                  updateDocument={updateDocument} 
                  deleteDocument={deleteDocument} 
                  updateStatus={updateDocumentStatus}
                  addClient={addClient}
                />
              } />
              <Route path="/invoices" element={
                <DocumentManager 
                  type={DocumentType.INVOICE} 
                  state={state} 
                  addDocument={addDocument} 
                  updateDocument={updateDocument} 
                  deleteDocument={deleteDocument} 
                  updateStatus={updateDocumentStatus}
                  addClient={addClient}
                />
              } />
              <Route path="/clients" element={
                <ClientManager 
                  state={state} 
                  addClient={addClient} 
                  addClients={addClients}
                  updateClient={updateClient} 
                  deleteClient={deleteClient} 
                />
              } />
              <Route path="/catalog" element={
                <CatalogManager 
                  state={state} 
                  addItem={addCatalogItem} 
                  updateItem={updateCatalogItem} 
                  deleteItem={deleteCatalogItem} 
                />
              } />
              <Route path="/sales" element={
                <TransactionManager 
                  type={TransactionType.SALE} 
                  state={state} 
                  addTransaction={addTransaction} 
                  deleteTransaction={deleteTransaction} 
                />
              } />
              <Route path="/expenses" element={
                <TransactionManager 
                  type={TransactionType.EXPENSE} 
                  state={state} 
                  addTransaction={addTransaction} 
                  deleteTransaction={deleteTransaction} 
                />
              } />
              <Route path="/users" element={
                currentUser.role === 'admin' ? (
                  <UserManager state={state} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} />
                ) : <Navigate to="/" replace />
              } />
              <Route path="/settings" element={
                currentUser.role === 'admin' ? (
                  <Settings business={state.business} updateBusiness={updateBusiness} />
                ) : <Navigate to="/" replace />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;