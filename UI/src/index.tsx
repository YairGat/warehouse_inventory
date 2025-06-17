import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';

// Ensure the element is found and correctly typed as HTMLElement
const rootElement = document.getElementById('root') as HTMLElement | null;

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <div>
        <style>{`
      body {
        margin: 0px;
        padding: 0px;
      }
    `}</style>
      </div>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );

} else {
  console.error('Root element not found');
}
