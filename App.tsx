import React, { useState, useEffect } from 'react';
import { Notebook } from './types';
import HomePage from './components/HomePage';
import NotebookView from './components/NotebookView';

const App: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedNotebooks = localStorage.getItem('notebooks');
      if (savedNotebooks) {
        // Add backward compatibility for createdAt for sorting
        const parsedNotebooks: Notebook[] = JSON.parse(savedNotebooks).map((nb: any) => ({
          ...nb,
          currency: nb.currency || 'Indian Rupees', // Fallback for old data
          createdAt: nb.createdAt || parseInt(nb.id.split('-')[1]) || Date.now()
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
    if (window.confirm('Are you sure you want to delete this notebook and all its entries?')) {
      setNotebooks(prev => prev.filter(n => n.id !== id));
      if (selectedNotebookId === id) {
        setSelectedNotebookId(null);
      }
    }
  };

  const handleUpdateNotebook = (updatedNotebook: Notebook) => {
    setNotebooks(prev => prev.map(n => n.id === updatedNotebook.id ? updatedNotebook : n));
  };
  
  const selectedNotebook = notebooks.find(n => n.id === selectedNotebookId);

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {!selectedNotebook ? (
          <HomePage
            notebooks={notebooks}
            onCreateNotebook={handleCreateNotebook}
            onSelectNotebook={setSelectedNotebookId}
            onDeleteNotebook={handleDeleteNotebook}
          />
        ) : (
          <NotebookView
            key={selectedNotebook.id} // Add key to force re-mount on notebook change
            notebook={selectedNotebook}
            onUpdateNotebook={handleUpdateNotebook}
            onBack={() => setSelectedNotebookId(null)}
          />
        )}
      </main>
    </div>
  );
};

export default App;