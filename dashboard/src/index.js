import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css';  // Optionnel si tu utilises des styles globaux
import App from './app';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
