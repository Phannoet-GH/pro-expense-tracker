import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ExpenseProvider } from './context/ExpenseContext';

// Client Portal Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import SavingsHub from './pages/SavingsHub';
import Settings from './pages/Settings';

// Admin Portal Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAudit from './pages/admin/AdminAudit';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSystem from './pages/admin/AdminSystem';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

export default function App() {
  return (
    <UserProvider>
      <ExpenseProvider>
        <BrowserRouter>
          <Routes>
            {/* Client-Side Portal Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="savings" element={<SavingsHub />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Admin-Side Portal Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="system" element={<AdminSystem />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ExpenseProvider>
    </UserProvider>
  );
}
