
import React, { useState, useMemo, useCallback } from 'react';
import { TransactionType, TransactionCategory } from '../types';
import type { Notebook, Transaction } from '../types';
import { ArrowLeftIcon, DownloadIcon, PlusIcon, EditIcon, TrashIcon, SparklesIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

interface NotebookViewProps {
  notebook: Notebook;
  onUpdateNotebook: (updatedNotebook: Notebook) => void;
  onBack: () => void;
}

interface TransactionFormData {
    date: string;
    item: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: string;
    paymentMode: string;
    description: string;
    comments: string;
}

const NotebookView: React.FC<NotebookViewProps> = ({ notebook, onUpdateNotebook, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType.EARNING | TransactionType.EXPENDITURE>('all');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { totalEarnings, totalExpenditure, balance, categoryData } = useMemo(() => {
    const earnings = notebook.transactions
      .filter(t => t.type === TransactionType.EARNING)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenditure = notebook.transactions
      .filter(t => t.type === TransactionType.EXPENDITURE)
      .reduce((sum, t) => sum + t.amount, 0);

    const categories: Record<string, number> = {};
    notebook.transactions
      .filter(t => t.type === TransactionType.EXPENDITURE)
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });

    return {
      totalEarnings: earnings,
      totalExpenditure: expenditure,
      balance: earnings - expenditure,
      categoryData: Object.entries(categories).sort((a, b) => b[1] - a[1])
    };
  }, [notebook.transactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let transactions = [...notebook.transactions];

    if (filterType !== 'all') {
      transactions = transactions.filter(t => t.type === filterType);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      transactions = transactions.filter(t =>
        t.item.toLowerCase().includes(lowercasedTerm) ||
        t.description.toLowerCase().includes(lowercasedTerm) ||
        t.category.toLowerCase().includes(lowercasedTerm) ||
        t.paymentMode.toLowerCase().includes(lowercasedTerm)
      );
    }

    transactions.sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return transactions;
  }, [notebook.transactions, filterType, searchTerm, sortOrder]);

  const getAIInsights = async () => {
    if (notebook.transactions.length === 0) return;
    setIsAiLoading(true);
    setAiInsight(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summary = notebook.transactions.slice(0, 20).map(t => `${t.date}: ${t.item} (${t.category}) - ${t.type === TransactionType.EXPENDITURE ? '-' : '+'}${t.amount}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze these recent financial transactions and provide a 3-sentence summary of spending habits and one specific tip to save money. Currency is ${notebook.currency}. Transactions:\n${summary}`,
      });

      setAiInsight(response.text);
    } catch (error) {
      console.error("AI Insight Error:", error);
      setAiInsight("Could not fetch insights at this time. Please try again later.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const updatedTransactions = notebook.transactions.filter(t => t.id !== id);
      onUpdateNotebook({ ...notebook, transactions: updatedTransactions });
    }
  };

  const handleSaveTransaction = (formData: TransactionFormData) => {
    if (editingTransaction) {
      const updatedTransactions = notebook.transactions.map(t =>
        t.id === editingTransaction.id ? { ...t, ...formData, amount: parseFloat(formData.amount) || 0 } : t
      );
      onUpdateNotebook({ ...notebook, transactions: updatedTransactions });
    } else {
      const newTransaction: Transaction = {
        id: `txn-${Date.now()}`,
        ...formData,
        amount: parseFloat(formData.amount) || 0,
      };
      onUpdateNotebook({ ...notebook, transactions: [...notebook.transactions, newTransaction] });
    }
    setIsModalOpen(false);
    setEditingTransaction(null);
  };
  
  const downloadCSV = useCallback(() => {
    const headers = ['Date', 'Item', 'Category', 'Type', 'Amount', 'Payment Mode', 'Description', 'Comments'];
    const rows = filteredAndSortedTransactions.map(t =>
      [t.date, t.item, t.category, t.type, t.amount, t.paymentMode, t.description, t.comments]
      .map(field => `"${String(field).replace(/"/g, '""')}"`)
      .join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${notebook.name.replace(/\s+/g, '_')}_transactions.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAndSortedTransactions, notebook.name]);

  return (
    <div className="space-y-6 text-slate-300 pb-24">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={onBack} className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors p-2 -ml-2">
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white text-right">{notebook.name}</h1>
      </header>
      
      {/* Financial Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50">
            <div className="text-center space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Available Balance</h3>
                  <p className={`text-4xl font-black mt-1 ${balance >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>
                    {notebook.currency} {balance.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                    <div className="text-left">
                        <span className="text-[10px] text-slate-500 block uppercase">Inflow</span>
                        <span className="text-green-400 font-bold">+{notebook.currency}{totalEarnings.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Outflow</span>
                        <span className="text-red-400 font-bold">-{notebook.currency}{totalExpenditure.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col justify-center">
            {aiInsight ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                    <SparklesIcon /> <span>AI Insights</span>
                </div>
                <p className="text-sm italic text-slate-300 leading-relaxed">"{aiInsight}"</p>
                <button onClick={getAIInsights} className="text-xs text-slate-500 hover:text-sky-400">Refresh Advice</button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-slate-400 text-sm">Need help managing your expenses?</p>
                <button 
                  onClick={getAIInsights} 
                  disabled={isAiLoading || notebook.transactions.length === 0}
                  className="flex items-center justify-center gap-2 w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  ) : <SparklesIcon />}
                  {isAiLoading ? 'Analyzing...' : 'Get AI Recommendations'}
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Spend Breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700/50">
            <h3 className="text-sm font-bold text-white mb-4">Spending by Category</h3>
            <div className="space-y-3">
                {categoryData.slice(0, 4).map(([cat, amount]) => {
                    const percentage = (amount / totalExpenditure) * 100;
                    return (
                        <div key={cat} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>{cat}</span>
                                <span>{notebook.currency} {amount.toLocaleString()} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-sky-500 h-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-slate-800 p-4 rounded-2xl shadow-lg space-y-4 border border-slate-700/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button onClick={downloadCSV} disabled={filteredAndSortedTransactions.length === 0} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 border border-slate-600">
              <DownloadIcon /> Export CSV
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <input
                type="text"
                placeholder="Search anything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-inner"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-4 pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">View</span>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button 
                        onClick={() => setFilterType('all')} 
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${filterType === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'}`}
                    >All</button>
                    <button 
                        onClick={() => setFilterType(TransactionType.EXPENDITURE)} 
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${filterType === TransactionType.EXPENDITURE ? 'bg-red-900/40 text-red-300' : 'text-slate-500'}`}
                    >Spend</button>
                    <button 
                        onClick={() => setFilterType(TransactionType.EARNING)} 
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${filterType === TransactionType.EARNING ? 'bg-green-900/40 text-green-300' : 'text-slate-500'}`}
                    >Earn</button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <select id="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none">
                    <option value="date-desc">Recent First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Highest Amount</option>
                    <option value="amount-asc">Lowest Amount</option>
                </select>
            </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredAndSortedTransactions.length > 0 ? (
          filteredAndSortedTransactions.map(t => (
            <div key={t.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
              <div className="flex gap-4 items-center flex-1">
                <div className={`p-3 rounded-xl flex-shrink-0 ${t.type === TransactionType.EARNING ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                   {t.type === TransactionType.EARNING ? '↓' : '↑'}
                </div>
                <div className="min-w-0">
                    <h4 className="font-bold text-white truncate">{t.item}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-4 pl-14 sm:pl-0">
                <div className="flex items-center gap-1">
                    <button onClick={() => handleEditTransaction(t)} className="p-2.5 text-slate-500 hover:text-sky-400 active:bg-slate-700 rounded-lg transition-colors" aria-label="Edit Entry"><EditIcon /></button>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="p-2.5 text-slate-500 hover:text-red-400 active:bg-slate-700 rounded-lg transition-colors" aria-label="Delete Entry"><TrashIcon /></button>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-lg leading-tight ${t.type === TransactionType.EARNING ? 'text-green-400' : 'text-slate-200'}`}>
                    {t.type === TransactionType.EXPENDITURE ? '-' : '+'}{notebook.currency}{t.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500">{t.paymentMode}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-slate-800 rounded-2xl border border-dashed border-slate-700">
            <p className="text-slate-400 font-medium">No activity found.</p>
            <p className="text-slate-500 text-sm mt-1">Ready to track your first transaction?</p>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button 
        onClick={handleAddTransaction}
        className="fixed bottom-6 right-6 w-14 h-14 bg-sky-500 hover:bg-sky-400 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-90 z-40 border-4 border-slate-900"
        aria-label="Add Transaction"
      >
        <PlusIcon />
      </button>
      
      {isModalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const TransactionModal: React.FC<{
  transaction: Transaction | null;
  onSave: (data: TransactionFormData) => void;
  onClose: () => void;
}> = ({ transaction, onSave, onClose }) => {
    const categories: TransactionCategory[] = [
        'Food & Drink', 'Shopping', 'Transport', 'Bills & Utilities', 
        'Entertainment', 'Health', 'Salary', 'Investment', 'Gift', 'Others'
    ];

    const [formData, setFormData] = useState<TransactionFormData>({
        date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        item: transaction?.item || '',
        type: transaction?.type || TransactionType.EXPENDITURE,
        category: transaction?.category || 'Others',
        amount: transaction?.amount.toString() || '',
        paymentMode: transaction?.paymentMode || '',
        description: transaction?.description || '',
        comments: transaction?.comments || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const formInputClasses = "w-full bg-slate-900 text-white placeholder-slate-500 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-inner";

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" role="dialog" aria-modal="true">
            <div className="bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-black text-white">{transaction ? 'Update' : 'New'} Entry</h2>
                    <button type="button" onClick={onClose} className="text-slate-500 p-2 text-2xl leading-none font-bold">&times;</button>
                </div>
                
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: TransactionType.EXPENDITURE}))} className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.type === TransactionType.EXPENDITURE ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    Spend
                  </button>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: TransactionType.EARNING}))} className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${formData.type === TransactionType.EARNING ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    Earn
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="amount" className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">How Much?</label>
                        <div className="relative">
                           <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className={`${formInputClasses} text-2xl font-black text-sky-400`} required />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="item" className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">Entry Name</label>
                        <input type="text" name="item" id="item" value={formData.item} onChange={handleChange} placeholder="e.g., Grocery Store, Client Payment" className={formInputClasses} required />
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">When?</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className={formInputClasses} required />
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">Category</label>
                        <select name="category" id="category" value={formData.category} onChange={handleChange} className={formInputClasses} required>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="paymentMode" className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">Payment Mode</label>
                        <input type="text" name="paymentMode" id="paymentMode" value={formData.paymentMode} onChange={handleChange} placeholder="e.g., Cash, Google Pay, Card" className={formInputClasses} />
                    </div>

                    <div className="sm:col-span-2">
                        <label htmlFor="description" className="block text-[10px] uppercase font-black text-slate-500 mb-1 ml-1 tracking-widest">Details (Optional)</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Add a quick note..." className={formInputClasses}></textarea>
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95">
                        {transaction ? 'Save Changes' : 'Add Entry'}
                    </button>
                    <button type="button" onClick={onClose} className="w-full text-slate-500 font-bold py-2 text-sm hover:text-white">Cancel</button>
                </div>
              </form>
            </div>
        </div>
    );
};

export default NotebookView;
