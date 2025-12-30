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
    console.log("Track.it: Application initialization started.");
  } catch (err) {
    console.error("Track.it: Critical Mounting Failure", err);
    // Let the global error handler in index.html take over
    throw err;
  }
} else {
  const msg = "Critical Error: The application root element (#root) was not found.";
  console.error(msg);
  alert(msg);
}
