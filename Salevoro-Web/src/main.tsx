import './styles/global.css';
import '@phosphor-icons/web/regular';
import './lib/theme.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { initDb, mockApiAdapter, httpAdapter } from './api/db';

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

initDb(apiUrl ? httpAdapter(apiUrl) : mockApiAdapter()).then(() => {
  createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
});
