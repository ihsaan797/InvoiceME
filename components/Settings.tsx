
import React, { useState, useRef } from 'react';
import { BusinessDetails } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  business: BusinessDetails;
  updateBusiness: (details: BusinessDetails) => void;
}

const CURRENCIES = [
    { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AED', symbol: 'DH', name: 'UAE Dirham' }
];

const Settings: React.FC<Props> = ({ business, updateBusiness }) => {
  const [details, setDetails] = useState<BusinessDetails>(business);
  const [isSaved, setIsSaved] = useState(false);
  const [isGeneratingTerms, setIsGeneratingTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusiness(details);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDetails(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDetails(prev => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateTerms = async () => {
    setIsGeneratingTerms(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate a modern, professional, and concise set of "Terms and Conditions" for a business named "${details.name || 'our company'}". 
      The terms should be formatted as a numbered list and include:
      1. Payment terms (e.g., net 7 or 30 days).
      2. Quote validity period.
      3. Brief note on cancellations or returns.
      4. Late payment interest note.
      Keep it under 150 words and sounding very professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      const generatedText = response.text;
      if (generatedText) {
        setDetails(prev => ({ ...prev, defaultTerms: generatedText.trim() }));
      }
    } catch (error) {
      console.error("Failed to generate terms:", error);
    } finally {
      setIsGeneratingTerms(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fadeIn pb-12">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Configure your company identity and regional preferences.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div 
                  onClick={handleLogoClick}
                  className="group relative w-24 h-24 rounded-2xl bg-slate-200 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden cursor-pointer hover:bg-slate-300 transition-all shrink-0"
                >
                    {details.logoUrl ? (
                      <img src={details.logoUrl} className="w-full h-full object-cover" alt="Business Logo" />
                    ) : (
                      <i className="fa-solid fa-building text-4xl text-slate-400"></i>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <i className="fa-solid fa-camera text-white text-xl"></i>
                    </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleLogoChange}
                />

                <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-800 truncate max-w-[250px] md:max-w-md">{details.name || 'Your Company Name'}</h2>
                    <p className="text-slate-500 text-sm">Update your logo and business information</p>
                    <div className="flex justify-center sm:justify-start gap-4 mt-3">
                      <button 
                        type="button" 
                        onClick={handleLogoClick}
                        className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1"
                      >
                        <i className="fa-solid fa-upload"></i>
                        Change Logo
                      </button>
                      {details.logoUrl && (
                        <button 
                          type="button" 
                          onClick={removeLogo}
                          className="text-red-500 text-xs font-semibold hover:underline flex items-center gap-1"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                          Remove
                        </button>
                      )}
                    </div>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-10">
          <section className="space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-4">Business Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                <input 
                    required
                    value={details.name}
                    onChange={(e) => setDetails({...details, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                />
                </div>
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Business Email</label>
                <input 
                    required
                    type="email"
                    value={details.email}
                    onChange={(e) => setDetails({...details, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                />
                </div>
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <input 
                    required
                    value={details.phone}
                    onChange={(e) => setDetails({...details, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                />
                </div>
                <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Physical Address</label>
                <input 
                    required
                    value={details.address}
                    onChange={(e) => setDetails({...details, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                />
                </div>
                <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">TIN Number</label>
                <input 
                    required
                    value={details.tinNumber}
                    onChange={(e) => setDetails({...details, tinNumber: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                    placeholder="Tax Identification Number"
                />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sidebar Footer Text (Powered by)</label>
                  <input 
                      value={details.poweredByText || ''}
                      onChange={(e) => setDetails({...details, poweredByText: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-sm"
                      placeholder="e.g. SANDPIX MALDIVES"
                  />
                </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-4">Regional & Tax Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Default GST/Tax Percentage (%)</label>
                  <div className="relative">
                    <input 
                        required
                        type="number"
                        step="0.01"
                        value={details.taxPercentage}
                        onChange={(e) => setDetails({...details, taxPercentage: parseFloat(e.target.value) || 0})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                        placeholder="e.g. 8"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Business Currency</label>
                  <select 
                      required
                      value={details.currency}
                      onChange={(e) => setDetails({...details, currency: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm appearance-none"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.code} ({curr.symbol}) - {curr.name}</option>
                    ))}
                  </select>
                </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-4">Document Numbering</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Invoice Prefix</label>
                  <input 
                      required
                      value={details.invoicePrefix}
                      onChange={(e) => setDetails({...details, invoicePrefix: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                      placeholder="e.g. INV"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quotation Prefix</label>
                  <input 
                      required
                      value={details.quotationPrefix}
                      onChange={(e) => setDetails({...details, quotationPrefix: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                      placeholder="e.g. QT"
                  />
                </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-base md:text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-4">Payment & Terms</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Details (Bank Info)</label>
                <textarea 
                    value={details.paymentDetails}
                    onChange={(e) => setDetails({...details, paymentDetails: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm min-h-[80px]"
                    placeholder="Bank account name, number, etc..."
                />
              </div>
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
                    <label className="block text-sm font-semibold text-slate-700">Default Terms & Conditions</label>
                    <button 
                        type="button"
                        disabled={isGeneratingTerms}
                        onClick={handleGenerateTerms}
                        className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <i className={`fa-solid ${isGeneratingTerms ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                        {isGeneratingTerms ? 'Processing...' : 'AI Suggest Terms'}
                    </button>
                </div>
                <textarea 
                    value={details.defaultTerms}
                    onChange={(e) => setDetails({...details, defaultTerms: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm min-h-[120px]"
                    placeholder="Enter standard terms..."
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-100">
            {isSaved ? (
                <span className="text-emerald-600 text-sm font-medium flex items-center gap-2">
                    <i className="fa-solid fa-check-circle"></i> Profile updated successfully!
                </span>
            ) : <span className="text-slate-400 text-xs italic text-center sm:text-left">Ensure all fields are accurate for legal documents</span>}
            <button 
              type="submit"
              className="w-full sm:w-auto px-10 py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-black transition-all"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
