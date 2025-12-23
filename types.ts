
export enum DocumentType {
  QUOTATION = 'QUOTATION',
  INVOICE = 'INVOICE'
}

export enum TransactionType {
  SALE = 'SALE',
  EXPENSE = 'EXPENSE'
}

export interface BusinessDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  tinNumber: string;
  currency: string;
  taxPercentage: number;
  invoicePrefix: string;
  quotationPrefix: string;
  logoUrl?: string;
  defaultTerms?: string;
  paymentDetails?: string;
  poweredByText?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CatalogItem {
  id: string;
  description: string;
  unitPrice: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  number: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientEmail: string;
  items: LineItem[];
  status: 'Draft' | 'Sent' | 'Paid' | 'Expired';
  notes?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  category: string;
  amount: number;
  description: string;
  reference?: string;
}

export interface AppState {
  business: BusinessDetails;
  documents: Document[];
  transactions: Transaction[];
  catalog: CatalogItem[];
  clients: Client[];
}
