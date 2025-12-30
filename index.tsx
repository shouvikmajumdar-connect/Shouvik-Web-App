import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

// Global error handler to catch issues before React mounts
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global JS Error:", message, error);
  const root = document.getElementById('root');
  if (root && root.querySelector('#boot-loader')) {
    root.innerHTML = `<div style="padding: 20px; color: #ef4444; font-family: sans-serif; text-align: center; height: 100vh; display: flex; flex-direction: column; justify-content: center; background: #0f172a;">
      <h2 style="font-weight: 900; margin-bottom: 8px;">Script Error</h2>
      <p style="font-size: 14px; opacity: 0.7;">${message}</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #0ea5e9; border: none; border-radius: 8px; color: white; font-weight: bold;">Try Again</button>
    </div>`;
  }
};

if (!rootElement) {
  console.error("Critical Error: Root element '#root' not found in DOM.");
} else {
  try {
    // We explicitly clear the loader if createRoot doesn't do it fast enough
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log("Track.it: Application successfully mounted.");
  } catch (error) {
    console.error("React Mounting Crash:", error);
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; font-family: sans-serif; background: #0f172a; color: white;">
        <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 10px; font-weight: 900;">Startup Error</h1>
        <p style="color: #94a3b8; margin-bottom: 20px; font-size: 14px;">The application failed to initialize properly.</p>
        <div style="background: #1e293b; padding: 15px; border-radius: 12px; font-size: 12px; overflow: auto; max-width: 100%; color: #f1f5f9; border: 1px solid #334155; text-align: left; font-family: monospace;">
          ${error instanceof Error ? `<strong>${error.name}:</strong> ${error.message}` : String(error)}
        </div>
        <button onclick="window.location.reload()" style="margin-top: 24px; padding: 12px 24px; background: #0ea5e9; border: none; border-radius: 12px; color: white; font-weight: bold; cursor: pointer;">Reload App</button>
      </div>
    `;
  }
}
