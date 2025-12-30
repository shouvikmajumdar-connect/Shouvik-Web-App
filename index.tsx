import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("Critical Error: Root element '#root' not found in DOM.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Track.it: Application mount sequence initiated.");
  } catch (error) {
    console.error("React Mounting Crash:", error);
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; font-family: sans-serif; background: #0f172a; color: white;">
        <h1 style="color: #ef4444; font-size: 24px; margin-bottom: 10px; font-weight: 900;">Startup Error</h1>
        <p style="color: #94a3b8; margin-bottom: 20px; font-size: 14px;">The application failed to initialize properly.</p>
        <div style="background: #1e293b; padding: 15px; border-radius: 12px; font-size: 12px; overflow: auto; max-width: 100%; color: #f1f5f9; border: 1px solid #334155; text-align: left; font-family: monospace;">
          ${error instanceof Error ? `<strong>${error.name}:</strong> ${error.message}` : String(error)}
        </div>
        <button onclick="window.location.reload()" style="margin-top: 24px; padding: 12px 24px; background: #0ea5e9; border: none; border-radius: 12px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">Reload App</button>
      </div>
    `;
  }
}
