import React, { useState, useMemo, useCallback } from 'react';
import { TransactionType } from '../types';
import type { Notebook, Transaction } from '../types';
import { ArrowLeftIcon, DownloadIcon, PlusIcon, EditIcon, TrashIcon } from './icons';

interface NotebookViewProps {
  notebook: Notebook;
  onUpdateNotebook: (updatedNotebook: Notebook) => void;
  onBack: () => void;
}

interface TransactionFormData {
    date: string;
    item: string;
    type: TransactionType;
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

  const { totalEarnings, totalExpenditure, balance } = useMemo(() => {
    const earnings = notebook.transactions
      .filter(t => t.type === TransactionType.EARNING)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenditure = notebook.transactions
      .filter(t => t.type === TransactionType.EXPENDITURE)
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalEarnings: earnings,
      totalExpenditure: expenditure,
      balance: earnings - expenditure,
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
    const headers = ['Date', 'Item', 'Type', 'Amount', 'Payment Mode', 'Description', 'Comments'];
    const rows = filteredAndSortedTransactions.map(t =>
      [t.date, t.item, t.type, t.amount, t.paymentMode, t.description, t.comments]
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
    <div className="space-y-6 text-slate-300">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={onBack} className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors">
          <ArrowLeftIcon />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white text-right">{notebook.name}</h1>
      </header>
      
      <div className="bg-slate-800 p-4 rounded-lg shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row justify-around items-center gap-4 text-center">
          <div className="flex-1">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Earnings</h3>
            <p className="text-2xl font-bold text-green-400">{notebook.currency} {totalEarnings.toLocaleString()}</p>
          </div>
          <div className="w-full sm:w-px sm:h-10 bg-slate-700"></div>
          <div className="flex-1">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Expenses</h3>
            <p className="text-2xl font-bold text-red-400">{notebook.currency} {totalExpenditure.toLocaleString()}</p>
          </div>
        </div>
        <div className="text-center pt-4 border-t border-slate-700">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Balance</h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-sky-400' : 'text-orange-400'}`}>{notebook.currency} {balance.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={handleAddTransaction} className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
              <PlusIcon /> Add Transaction
            </button>
            <button onClick={downloadCSV} disabled={filteredAndSortedTransactions.length === 0} className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <DownloadIcon /> CSV
            </button>
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2">
                <label htmlFor="filterType" className="text-sm">Show:</label>
                <select id="filterType" value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none">
                    <option value="all">All</option>
                    <option value={TransactionType.EARNING}>Earnings</option>
                    <option value={TransactionType.EXPENDITURE}>Expenditures</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="sortOrder" className="text-sm">Sort by:</label>
                <select id="sortOrder" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none">
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Amount (High-Low)</option>
                    <option value="amount-asc">Amount (Low-High)</option>
                </select>
            </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        {filteredAndSortedTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-700/50 text-xs uppercase text-slate-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Item / Description</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3">Payment Mode</th>
                  <th scope="col" className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTransactions.map(t => (
                  <tr key={t.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{t.item}</p>
                      <p className="text-slate-400 text-xs">{t.description}</p>
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${t.type === TransactionType.EARNING ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === TransactionType.EXPENDITURE ? '-' : '+'}{notebook.currency} {t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{t.paymentMode}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-4">
                        <button onClick={() => handleEditTransaction(t)} className="text-sky-400 hover:text-sky-300" aria-label="Edit"><EditIcon /></button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="text-red-400 hover:text-red-300" aria-label="Delete"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400">No transactions found.</p>
            <p className="text-slate-500 mt-1">Click "Add Transaction" to get started.</p>
          </div>
        )}
      </div>
      
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
    const [formData, setFormData] = useState<TransactionFormData>({
        date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        item: transaction?.item || '',
        type: transaction?.type || TransactionType.EXPENDITURE,
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
    
    const formInputClasses = "w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none transition";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">{transaction ? 'Edit' : 'Add'} Transaction</h2>
                
                <div className="flex rounded-md shadow-sm">
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: TransactionType.EXPENDITURE}))} className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${formData.type === TransactionType.EXPENDITURE ? 'bg-red-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    Expenditure
                  </button>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: TransactionType.EARNING}))} className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${formData.type === TransactionType.EARNING ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    Earning
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className={formInputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Amount</label>
                        <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" min="0" step="0.01" className={formInputClasses} required />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="item" className="block text-sm font-medium text-slate-300 mb-1">Item / Service</label>
                        <input type="text" name="item" id="item" value={formData.item} onChange={handleChange} placeholder="e.g., Groceries, Salary" className={formInputClasses} required />
                    </div>
                    <div>
                        <label htmlFor="paymentMode" className="block text-sm font-medium text-slate-300 mb-1">Payment Mode</label>
                        <input type="text" name="paymentMode" id="paymentMode" value={formData.paymentMode} onChange={handleChange} placeholder="e.g., Credit Card, Cash" className={formInputClasses} />
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
                        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Brief details about the transaction" className={formInputClasses}></textarea>
                    </div>
                    <div className="sm:col-span-2">
                        <label htmlFor="comments" className="block text-sm font-medium text-slate-300 mb-1">Comments (Optional)</label>
                        <textarea name="comments" id="comments" value={formData.comments} onChange={handleChange} rows={2} placeholder="Any personal notes" className={formInputClasses}></textarea>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                    <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-md transition-colors">Cancel</button>
                    <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-md transition-colors">Save</button>
                </div>
              </form>
            </div>
        </div>
    );
};

export default NotebookView;