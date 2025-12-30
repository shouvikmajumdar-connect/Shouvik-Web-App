
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global error handler for catching startup crashes
window.onerror = (msg, url, lineNo, columnNo, error) => {
  console.error('Track.it Crash Handler:', { msg, url, lineNo, columnNo, error });
  return false;
};

// Register Service Worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  console.error("React Mounting Error:", err);
  rootElement.innerHTML = `<div style="color: white; padding: 20px; text-align: center;">Something went wrong while loading the app. Please refresh.</div>`;
}
