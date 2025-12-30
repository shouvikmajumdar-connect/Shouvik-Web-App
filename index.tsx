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
    console.log("Track.it: DOM hydration successful.");
  } catch (err) {
    console.error("React Mounting Failed:", err);
    // The HTML-level error handler will catch this if it bubbles
    throw err;
  }
} else {
  console.error("Critical: The application root element was not found in the document.");
}
