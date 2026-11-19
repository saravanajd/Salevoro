import React from 'react';
import { createBrowserRouter, Outlet, useLocation } from 'react-router-dom';
import { setRouter } from './lib/nav';
import AppShell from './app/AppShell';
import Login from './pages/Login/Login';
import Billing from './pages/Billing/Billing';
import Categories from './pages/Categories/Categories';
import Customers from './pages/Customers/Customers';
import Dashboard from './pages/Dashboard/Dashboard';
import Events from './pages/Events/Events';
import GST from './pages/GST/GST';
import Inventory from './pages/Inventory/Inventory';
import Invoices from './pages/Invoices/Invoices';
import Products from './pages/Products/Products';
import Profile from './pages/Profile/Profile';
import Purchases from './pages/Purchases/Purchases';
import Reports from './pages/Reports/Reports';
import Schema from './pages/Schema/Schema';
import Store from './pages/Store/Store';
import WhatsApp from './pages/WhatsApp/WhatsApp';

function Root() {
  return <Outlet />;
}

function Shell() {
  const location = useLocation();
  return <AppShell location={location} />;
}

// Remount the page on every navigation (same behaviour as reloading it).
function Page({ C }: { C: React.ComponentType<any> }) {
  const { key } = useLocation();
  return <C key={key} />;
}

const pages: [string, React.ComponentType<any>][] = [
  ['billing', Billing],
  ['categories', Categories],
  ['customers', Customers],
  ['dashboard', Dashboard],
  ['events', Events],
  ['gst', GST],
  ['inventory', Inventory],
  ['invoices', Invoices],
  ['products', Products],
  ['profile', Profile],
  ['purchases', Purchases],
  ['reports', Reports],
  ['schema', Schema],
  ['store', Store],
  ['whatsapp', WhatsApp],
];

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/login', element: <Login /> },
      {
        path: '/',
        element: <Shell />,
        children: [
          { index: true, element: null },
          ...pages.map(([path, C]) => ({ path, element: <Page C={C} /> })),
          { path: '*', element: null },
        ],
      },
    ],
  },
]);

setRouter(router);
