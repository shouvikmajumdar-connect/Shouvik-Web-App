
import React, { useState, useEffect } from 'react';
import { Notebook } from './types';
import HomePage from './components/HomePage';
import NotebookView from './components/NotebookView';

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  // Handle Boot Loader Removal
  useEffect(() => {
    const loader = document.getElementById('boot-loader');
    if (loader) {
      // Small delay to ensure smooth visual transition after render
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
      }, 100);
    }
  }, []);

  useEffect(() => {
    try {
      const savedNotebooks = localStorage.getItem('notebooks');
      if (savedNotebooks) {
        const parsedNotebooks: Notebook[] = JSON.parse(savedNotebooks).map((nb: any) => ({
          ...nb,
          currency: nb.currency || '₹',
          createdAt: nb.createdAt || Date.now(),
          transactions: nb.transactions || []
        }));
        setNotebooks(parsedNotebooks);
      }
    } catch (error) {
      console.error("Failed to load notebooks from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('notebooks', JSON.stringify(notebooks));
    } catch (error) {
      console.error("Failed to save notebooks to localStorage", error);
    }
  }, [notebooks]);

  const handleCreateNotebook = (name: string, currency: string) => {
    const newNotebook: Notebook = {
      id: `notebook-${Date.now()}`,
      name,
      currency,
      transactions: [],
      createdAt: Date.now(),
    };
    setNotebooks(prev => [...prev, newNotebook]);
  };

  const handleDeleteNotebook = (id: string) => {
    if (window.confirm('Delete this notebook permanently? This cannot be undone.')) {
      setNotebooks(prev => prev.filter(n => n.id !== id));
      if (selectedNotebookId === id) {
        setSelectedNotebookId(null);
      }
    }
  };

  const handleUpdateNotebook = (updatedNotebook: Notebook) => {
    setNotebooks(prev => prev.map(n => n.id === updatedNotebook.id ? updatedNotebook : n));
  };

  const handleImportData = (importedNotebooks: Notebook[]) => {
    // Basic deduplication based on ID
    setNotebooks(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newEntries = importedNotebooks.filter(n => !existingIds.has(n.id));
      return [...prev, ...newEntries];
    });
  };
  
  const selectedNotebook = notebooks.find(n => n.id === selectedNotebookId);

  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-sky-500/30">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {!selectedNotebook ? (
          <HomePage
            notebooks={notebooks}
            onCreateNotebook={handleCreateNotebook}
            onSelectNotebook={setSelectedNotebookId}
            onDeleteNotebook={handleDeleteNotebook}
            onImportData={handleImportData}
          />
        ) : (
          <NotebookView
            key={selectedNotebook.id}
            notebook={selectedNotebook}
            onUpdateNotebook={handleUpdateNotebook}
            onBack={() => setSelectedNotebookId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default App;