import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Mounting Error:", error);
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; font-family: sans-serif; background: #0f172a; color: white;">
        <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 10px;">Startup Error</h1>
        <p style="color: #94a3b8; margin-bottom: 20px;">The application encountered an error while starting.</p>
        <pre style="background: #1e293b; padding: 15px; border-radius: 12px; font-size: 12px; overflow: auto; max-width: 100%; color: #f1f5f9; border: 1px solid #334155;">${error instanceof Error ? error.message : String(error)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 24px; padding: 12px 24px; background: #0ea5e9; border: none; border-radius: 12px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Refresh App</button>
      </div>
    `;
  }
}

// Service worker commented out temporarily to ensure clean browser cache during debugging
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(error => console.log('SW failed: ', error));
  });
}
*/
