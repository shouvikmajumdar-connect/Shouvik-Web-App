import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Track.it: Application core successfully mounted.");
  } catch (err) {
    console.error("Track.it: Error during React mount sequence", err);
    throw err;
  }
} else {
  console.error("Fatal Error: Root container not found in DOM.");
}
