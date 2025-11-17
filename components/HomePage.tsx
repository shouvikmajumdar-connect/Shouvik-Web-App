
import React, { useState, useMemo } from 'react';
import type { Notebook } from '../types';
import { TrashIcon } from './icons';
import { currencies } from '../data/currencies';

interface HomePageProps {
  notebooks: Notebook[];
  onCreateNotebook: (name: string, currency: string) => void;
  onSelectNotebook: (id: string) => void;
  onDeleteNotebook: (id: string) => void;
}

type SortOrder = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

const HomePage: React.FC<HomePageProps> = ({ notebooks, onCreateNotebook, onSelectNotebook, onDeleteNotebook }) => {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookCurrency, setNewNotebookCurrency] = useState('₹');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      onCreateNotebook(newNotebookName.trim(), newNotebookCurrency);
      setNewNotebookName('');
      setNewNotebookCurrency('₹');
    }
  };

  const sortedNotebooks = useMemo(() => {
    return [...notebooks].sort((a, b) => {
        switch (sortOrder) {
            case 'date-asc':
                return a.createdAt - b.createdAt;
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'date-desc':
            default:
                return b.createdAt - a.createdAt;
        }
    });
  }, [notebooks, sortOrder]);

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-sky-400">Track.it</h1>
        <p className="text-slate-500 mt-0.5 text-base italic">by Shouvik</p>
        <p className="text-slate-400 mt-2">Create and manage your financial notebooks</p>
      </header>
      
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-white">Create New Notebook</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
                <label htmlFor="notebookName" className="block text-sm font-medium text-slate-300 mb-1">Notebook Name</label>
                <input
                  id="notebookName"
                  type="text"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  placeholder="e.g., Personal Expenses 2024"
                  className="w-full bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  required
                />
            </div>
            <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-300 mb-1">Currency</label>
                <select
                  id="currency"
                  value={newNotebookCurrency}
                  onChange={(e) => setNewNotebookCurrency(e.target.value)}
                  className="w-full bg-slate-700 text-white border border-slate-600 rounded-md px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  required
                >
                  {currencies.map(c => (
                    <option key={c.name} value={c.symbol}>{c.symbol} {c.name}</option>
                  ))}
                </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!newNotebookName.trim()}
          >
            Create Notebook
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-2xl font-semibold text-white">Your Notebooks</h2>
            <div className="flex items-center gap-2">
                <label htmlFor="sortOrder" className="text-sm text-slate-400">Sort by:</label>
                <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="bg-slate-700 text-white border border-slate-600 rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-sky-500 focus:outline-none"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                </select>
            </div>
        </div>

        {notebooks.length === 0 ? (
          <div className="text-center py-10 bg-slate-800 rounded-lg">
            <p className="text-slate-400">You have no notebooks yet.</p>
            <p className="text-slate-500">Create one above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNotebooks.map(notebook => (
              <div key={notebook.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col justify-between">
                <div 
                  onClick={() => onSelectNotebook(notebook.id)}
                  className="p-6 cursor-pointer hover:bg-slate-700/50 transition-colors duration-300 flex-grow"
                >
                  <h3 className="text-xl font-bold text-sky-400">{notebook.name}</h3>
                  <p className="text-sm text-slate-400 mt-2">{notebook.transactions.length} entries &bull; {notebook.currency}</p>
                </div>
                 <button
                    onClick={(e) => { e.stopPropagation(); onDeleteNotebook(notebook.id); }}
                    className="flex items-center justify-center gap-2 w-full bg-red-800/50 hover:bg-red-700/70 p-2 text-red-300 transition-colors duration-300"
                    aria-label={`Delete notebook ${notebook.name}`}
                >
                    <TrashIcon />
                    <span>Delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
