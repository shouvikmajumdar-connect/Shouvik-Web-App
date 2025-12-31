import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const loader = document.getElementById('boot-loader');

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Remove the loader once React starts rendering
  if (loader) {
    loader.classList.add('hidden');
    // Optional: remove from DOM entirely after transition
    setTimeout(() => loader.remove(), 500);
  }
  
  console.log("Track.it: Core application mounted successfully.");
} else {
  console.error("Track.it: Root element not found.");
}
