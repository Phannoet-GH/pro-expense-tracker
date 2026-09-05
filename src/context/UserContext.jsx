import React, { createContext, useState, useEffect, useCallback } from 'react';
import { parseResponse, apiFetch } from '../utils/api';

export const UserContext = createContext();

export const DEMO_CREDENTIALS = [];

export function UserProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('smartfinance_auth_token') || null);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('smartfinance_current_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch {}
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Helper: Offline demo authentication
  const handleOfflineLogin = (email, password) => {
    const input = (email || '').trim().toLowerCase();

    // 1. Super Administrator Check
    if ((input === 'admin@gmail.com' || input === 'admin@smartfinance.pro' || input === 'admin' || input === 'administrator') && password === 'admin') {
      const adminUser = {
        id: 'usr-admin-master',
        name: 'Administrator',
        email: 'admin@gmail.com',
        role: 'admin',
        status: 'active',
        plan_tier: 'enterprise',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
      const mockToken = `mock-jwt-admin-${Date.now()}`;
      setToken(mockToken);
      setCurrentUser(adminUser);
      localStorage.setItem('smartfinance_auth_token', mockToken);
      localStorage.setItem('smartfinance_current_user', JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }

    if ((input === 'admin@gmail.com' || input === 'admin@smartfinance.pro' || input === 'admin') && password !== 'admin') {
      throw new Error('Invalid password for Administrator.');
    }

    // 2. Local Registered Users Check
    let localUsers = [];
    try {
      localUsers = JSON.parse(localStorage.getItem('smartfinance_local_users') || '[]');
    } catch {}

    const found = localUsers.find(
      u => u.email?.toLowerCase() === input || u.name?.toLowerCase() === input
    );

    if (found) {
      if (found.password === password) {
        const userObj = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role || 'client',
          status: 'active',
          plan_tier: 'free',
          avatar: found.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(found.name)}&background=0D8ABC&color=fff`
        };
        const mockToken = `mock-jwt-client-${found.id}-${Date.now()}`;
        setToken(mockToken);
        setCurrentUser(userObj);
        localStorage.setItem('smartfinance_auth_token', mockToken);
        localStorage.setItem('smartfinance_current_user', JSON.stringify(userObj));
        return { success: true, user: userObj };
      }
      throw new Error('Invalid password. Please check your credentials and try again.');
    }

    // 3. Demo Client Fallback
    if ((input === 'client' || input === 'client@smartfinance.pro') && (password === 'client' || password === '123456')) {
      const demoClient = {
        id: 'usr-client-demo',
        name: 'Demo Client',
        email: 'client@smartfinance.pro',
        role: 'client',
        status: 'active',
        plan_tier: 'pro',
        avatar: 'https://ui-avatars.com/api/?name=Demo+Client&background=10b981&color=fff'
      };
      const mockToken = `mock-jwt-client-${Date.now()}`;
      setToken(mockToken);
      setCurrentUser(demoClient);
      localStorage.setItem('smartfinance_auth_token', mockToken);
      localStorage.setItem('smartfinance_current_user', JSON.stringify(demoClient));
      return { success: true, user: demoClient };
    }

    throw new Error(`No local account found for "${input}". Please switch to the "Create Account" tab to register, or sign in as admin (admin / admin).`);
  };

  // Helper: Offline demo registration
  const handleOfflineRegister = (userData) => {
    const name = (userData.name || '').trim();
    const email = (userData.email || '').trim().toLowerCase();
    const password = userData.password || '';

    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required.');
    }

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    let localUsers = [];
    try {
      localUsers = JSON.parse(localStorage.getItem('smartfinance_local_users') || '[]');
    } catch {}

    if (localUsers.some(u => u.email?.toLowerCase() === email)) {
      throw new Error('An account with this email address already exists. Please switch to the "Sign In" tab to log in.');
    }

    const newId = `usr-loc-${Date.now()}`;
    const newUser = {
      id: newId,
      name,
      email,
      password,
      role: 'client',
      status: 'active',
      plan_tier: 'free',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
      created_at: new Date().toISOString()
    };

    localUsers.push(newUser);
    localStorage.setItem('smartfinance_local_users', JSON.stringify(localUsers));

    const userSession = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      plan_tier: 'free',
      avatar: newUser.avatar
    };

    const mockToken = `mock-jwt-client-${newUser.id}-${Date.now()}`;
    setToken(mockToken);
    setCurrentUser(userSession);
    localStorage.setItem('smartfinance_auth_token', mockToken);
    localStorage.setItem('smartfinance_current_user', JSON.stringify(userSession));
    return { success: true, user: userSession };
  };

  // Verify stored token on initial load
  const verifySession = useCallback(async (authToken) => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    // Mock tokens verify immediately via localStorage
    if (authToken.startsWith('mock-jwt-')) {
      const savedUser = localStorage.getItem('smartfinance_current_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      const { ok, data, isHtml, isOffline } = await parseResponse(res);

      if (ok && data?.user) {
        setCurrentUser(data.user);
        localStorage.setItem('smartfinance_current_user', JSON.stringify(data.user));
      } else if (isHtml || isOffline || res?.status === 404 || res?.status === 405) {
        // Backend is offline / static host; keep current session if available
        const savedUser = localStorage.getItem('smartfinance_current_user');
        if (savedUser) {
          try { setCurrentUser(JSON.parse(savedUser)); } catch {}
        }
      } else if (res?.status === 401 || res?.status === 403) {
        // Token was explicitly rejected by backend
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('smartfinance_auth_token');
        localStorage.removeItem('smartfinance_current_user');
      }
    } catch {
      // Network error; preserve session offline
      const savedUser = localStorage.getItem('smartfinance_current_user');
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch {}
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession(token);
  }, [token, verifySession]);

  // Login
  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      let isBackendOffline = false;
      let apiData = null;

      try {
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const parsed = await parseResponse(res);
        if (parsed.ok && parsed.data?.token && parsed.data?.user) {
          setToken(parsed.data.token);
          setCurrentUser(parsed.data.user);
          localStorage.setItem('smartfinance_auth_token', parsed.data.token);
          localStorage.setItem('smartfinance_current_user', JSON.stringify(parsed.data.user));
          return { success: true, user: parsed.data.user };
        }

        if (parsed.isHtml || parsed.isOffline || res.status === 404 || res.status === 405) {
          isBackendOffline = true;
        } else {
          apiData = parsed.data;
        }
      } catch {
        isBackendOffline = true;
      }

      // Backend is unreachable
      if (isBackendOffline) {
        throw new Error('Cannot reach the server. Please check your internet connection or try again later.');
      }

      throw new Error(apiData?.error || 'Invalid email or password. Please check your credentials and try again.');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (userData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      let isBackendOffline = false;
      let apiData = null;

      try {
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        const parsed = await parseResponse(res);
        if (parsed.ok && parsed.data?.token && parsed.data?.user) {
          setToken(parsed.data.token);
          setCurrentUser(parsed.data.user);
          localStorage.setItem('smartfinance_auth_token', parsed.data.token);
          localStorage.setItem('smartfinance_current_user', JSON.stringify(parsed.data.user));
          return { success: true, user: parsed.data.user };
        }

        if (parsed.isHtml || parsed.isOffline || res.status === 404 || res.status === 405) {
          isBackendOffline = true;
        } else {
          apiData = parsed.data;
        }
      } catch {
        isBackendOffline = true;
      }

      // Backend is unreachable
      if (isBackendOffline) {
        throw new Error('Cannot reach the server. Please check your internet connection or try again later.');
      }

      throw new Error(apiData?.error || 'Registration failed. Please check your inputs and try again.');
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    if (token && !token.startsWith('mock-jwt-')) {
      try {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {}
    }

    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('smartfinance_auth_token');
    localStorage.removeItem('smartfinance_current_user');
  };

  // Change Password
  const changePassword = async (oldPassword, newPassword) => {
    if (!token) throw new Error('Not authenticated');

    if (token.startsWith('mock-jwt-')) {
      const user = currentUser;
      if (!user) throw new Error('User not found');
      let localUsers = [];
      try {
        localUsers = JSON.parse(localStorage.getItem('smartfinance_local_users') || '[]');
      } catch {}
      const idx = localUsers.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        localUsers[idx].password = newPassword;
        localStorage.setItem('smartfinance_local_users', JSON.stringify(localUsers));
      }
      return true;
    }

    const res = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });

    const { ok, data } = await parseResponse(res);
    if (!ok) {
      throw new Error(data?.error || 'Password update failed');
    }
    return true;
  };

  return (
    <UserContext.Provider
      value={{
        token,
        currentUser,
        currentUserId: currentUser?.id,
        activeRole: currentUser?.role || 'client',
        isAuthenticated: Boolean(currentUser && token),
        isLoading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        changePassword,
        demoCredentials: DEMO_CREDENTIALS
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
