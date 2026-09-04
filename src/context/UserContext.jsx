import React, { createContext, useState, useEffect, useCallback } from 'react';

export const UserContext = createContext();

export const DEMO_CREDENTIALS = [
  {
    role: 'client',
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    password: 'SophiaPass@2026',
    title: 'Senior UX Designer',
    badge: 'Standard Client'
  },
  {
    role: 'client',
    name: 'Marcus Brody',
    email: 'marcus.brody@example.com',
    password: 'MarcusPass@2026',
    title: 'Freelance Software Architect',
    badge: 'Freelancer Client'
  },
  {
    role: 'client',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    password: 'ElenaPass@2026',
    title: 'Marketing Director',
    badge: 'Executive Client'
  },
  {
    role: 'admin',
    name: 'Alex Vance',
    email: 'admin@smartfinance.pro',
    password: 'AdminPass@2026',
    title: 'Lead System Administrator',
    badge: 'Platform Administrator'
  }
];

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

  // Authenticate session on load
  const verifySession = useCallback(async (authToken) => {
    if (!authToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('smartfinance_current_user', JSON.stringify(data.user));
      } else {
        // Invalid or expired token
        setToken(null);
        setCurrentUser(null);
        localStorage.removeItem('smartfinance_auth_token');
        localStorage.removeItem('smartfinance_current_user');
      }
    } catch (err) {
      console.warn('Network error checking auth session:', err);
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('smartfinance_auth_token', data.token);
      localStorage.setItem('smartfinance_current_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem('smartfinance_auth_token', data.token);
      localStorage.setItem('smartfinance_current_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
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

    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password update failed');
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
