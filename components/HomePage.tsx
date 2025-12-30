
import React, { useState, useMemo, useRef } from 'react';
import type { Notebook } from '../types';
import { TrashIcon, DownloadIcon, UploadIcon, PlusIcon } from './icons';
import { currencies } from '../data/currencies';

interface HomePageProps {
  notebooks: Notebook[];
  onCreateNotebook: (name: string, currency: string) => void;
  onSelectNotebook: (id: string) => void;
  onDeleteNotebook: (id: string) => void;
  onImportData: (data: Notebook[]) => void;
}

type SortOrder = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

const HomePage: React.FC<HomePageProps> = ({ notebooks, onCreateNotebook, onSelectNotebook, onDeleteNotebook, onImportData }) => {
  const [newNotebookName, setNewNotebookName] = useState('');
  const [newNotebookCurrency, setNewNotebookCurrency] = useState('₹');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNotebookName.trim()) {
      onCreateNotebook(newNotebookName.trim(), newNotebookCurrency);
      setNewNotebookName('');
      setNewNotebookCurrency('₹');
      setShowCreateForm(false);
    }
  };

  const exportBackup = () => {
    const dataStr = JSON.stringify(notebooks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `trackit_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (window.confirm('This will merge the imported notebooks with your current ones. Continue?')) {
            onImportData(json);
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error reading backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const sortedNotebooks = useMemo(() => {
    return [...notebooks].sort((a, b) => {
        switch (sortOrder) {
            case 'date-asc': return a.createdAt - b.createdAt;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            default: return b.createdAt - a.createdAt;
        }
    });
  }, [notebooks, sortOrder]);

  return (
    <div className="space-y-8 pb-20">
      <header className="text-center pt-4">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400 tracking-tight italic">Track.it</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">Smart Expense Monitoring</p>
      </header>
      
      {/* Quick Stats & Data Management */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Cloud Simulation</h3>
            <div className="flex gap-3">
                <button 
                    onClick={exportBackup}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-3 rounded-2xl transition-all"
                >
                    <DownloadIcon /> Backup
                </button>
                <button 
                    onClick={handleImportClick}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-3 rounded-2xl transition-all"
                >
                    <UploadIcon /> Restore
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center">Data is stored locally in your browser. Use Backup for safety.</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl flex flex-col justify-center">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Assets</h3>
            <p className="text-3xl font-black text-white">{notebooks.length} <span className="text-slate-500 text-sm font-normal">Notebooks</span></p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xl font-black text-white px-2">Your Vault</h2>
            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="bg-slate-800 text-slate-300 border border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
            >
                <option value="date-desc">Newest</option>
                <option value="name-asc">A-Z</option>
            </select>
        </div>

        {notebooks.length === 0 ? (
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-700/50">
            <div className="w-16 h-16 bg-slate-700/30 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <PlusIcon />
            </div>
            <p className="text-slate-400 font-bold">The vault is empty</p>
            <p className="text-slate-500 text-sm mt-1">Tap the plus button to start tracking</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedNotebooks.map(notebook => (
              <div key={notebook.id} className="group relative bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-3xl transition-all duration-300 active:scale-[0.98]">
                <div 
                  onClick={() => onSelectNotebook(notebook.id)}
                  className="p-6 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl">
                          <span className="text-lg font-bold">{notebook.currency}</span>
                      </div>
                      <button
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDeleteNotebook(notebook.id); 
                        }}
                        className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                        aria-label="Delete"
                      >
                        <TrashIcon />
                      </button>
                  </div>
                  <h3 className="text-lg font-black text-white truncate">{notebook.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-bold">{notebook.transactions.length} ENTRIES</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB for creation */}
      <button 
        onClick={() => setShowCreateForm(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-sky-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-90 z-40 border-4 border-slate-900"
      >
        <PlusIcon />
      </button>

      {/* Create Modal (Bottom Sheet Style) */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center p-0" onClick={() => setShowCreateForm(false)}>
            <div className="bg-slate-800 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2 opacity-50" />
                <h2 className="text-2xl font-black text-white">New Notebook</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Notebook Title</label>
                        <input
                            autoFocus
                            type="text"
                            value={newNotebookName}
                            onChange={(e) => setNewNotebookName(e.target.value)}
                            placeholder="e.g. Monthly Expenses"
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Currency</label>
                        <select
                            value={newNotebookCurrency}
                            onChange={(e) => setNewNotebookCurrency(e.target.value)}
                            className="w-full bg-slate-900 text-white border border-slate-700 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                        >
                            {currencies.map(c => (
                                <option key={c.name} value={c.symbol}>{c.symbol} ({c.name})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={!newNotebookName.trim()}
                        className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-5 rounded-3xl transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        Create Now
                    </button>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="w-full text-slate-500 font-bold py-2">Maybe Later</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
