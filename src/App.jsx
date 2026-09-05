import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { BillingProvider } from './context/BillingContext';
import { ExpenseProvider } from './context/ExpenseContext';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';

// Client Portal Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import SavingsHub from './pages/SavingsHub';
import TaxReports from './pages/TaxReports';
import Settings from './pages/Settings';

// Admin Portal Components
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import AdminSystem from './pages/admin/AdminSystem';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

export default function App() {
  return (
    <UserProvider>
      <BillingProvider>
        <ExpenseProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Marketing & Landing Routes */}
              <Route path="/welcome" element={<LandingPage />} />
              <Route path="/pricing" element={<LandingPage />} />

              {/* Public Authentication Route */}
              <Route path="/auth" element={<Auth />} />

              {/* Authenticated Client-Side Portal Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="savings" element={<SavingsHub />} />
                <Route path="tax-reports" element={<TaxReports />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>

            {/* Admin-Side Portal Routes (Admin Role Guarded) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="system" element={<AdminSystem />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
          </Routes>
        </BrowserRouter>
      </ExpenseProvider>
    </BillingProvider>
  </UserProvider>
);
}
