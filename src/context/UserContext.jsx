import React, { createContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const UserContext = createContext();

export const INITIAL_USERS = [
  {
    id: 'user-admin',
    name: 'Alex Vance',
    email: 'alex.vance@smartfinance.pro',
    role: 'admin',
    title: 'Lead System Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    monthlyTargetIncome: 8000,
    targetSavingsRate: 35,
    joinDate: '2025-01-15'
  },
  {
    id: 'user-1',
    name: 'Sophia Chen',
    email: 'sophia.chen@example.com',
    role: 'client',
    title: 'Senior UX Designer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    monthlyTargetIncome: 5500,
    targetSavingsRate: 25,
    joinDate: '2025-02-10'
  },
  {
    id: 'user-2',
    name: 'Marcus Brody',
    email: 'marcus.brody@example.com',
    role: 'client',
    title: 'Freelance Software Architect',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    monthlyTargetIncome: 4200,
    targetSavingsRate: 20,
    joinDate: '2025-03-01'
  },
  {
    id: 'user-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    role: 'client',
    title: 'Marketing Director',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    monthlyTargetIncome: 6200,
    targetSavingsRate: 30,
    joinDate: '2025-04-18'
  }
];

export function UserProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('smartfinance_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved users:', e);
      }
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState(() => {
    return localStorage.getItem('smartfinance_current_user_id') || 'user-1';
  });

  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('smartfinance_active_role') || 'client';
  });

  // Save changes
  useEffect(() => {
    localStorage.setItem('smartfinance_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('smartfinance_current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('smartfinance_active_role', activeRole);
  }, [activeRole]);

  // Current user object
  const currentUser = users.find(u => u.id === currentUserId) || users[1] || users[0];

  // Switch active user
  const switchUser = useCallback((userId) => {
    const found = users.find(u => u.id === userId);
    if (found) {
      setCurrentUserId(userId);
      setActiveRole(found.role);
    }
  }, [users]);

  // Switch role directly
  const switchRole = useCallback((role) => {
    setActiveRole(role);
    if (role === 'admin') {
      const adminUser = users.find(u => u.role === 'admin') || users[0];
      setCurrentUserId(adminUser.id);
    } else {
      const clientUser = users.find(u => u.role === 'client') || users[1];
      setCurrentUserId(clientUser.id);
    }
  }, [users]);

  // Add new client user
  const addUser = useCallback((userData) => {
    const newUser = {
      id: `user-${uuidv4().substring(0, 8)}`,
      role: 'client',
      status: 'active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0D8ABC&color=fff`,
      joinDate: new Date().toISOString().split('T')[0],
      monthlyTargetIncome: parseFloat(userData.monthlyTargetIncome) || 4000,
      targetSavingsRate: parseFloat(userData.targetSavingsRate) || 20,
      ...userData
    };
    setUsers(prev => [newUser, ...prev]);
    return newUser;
  }, []);

  // Update user
  const updateUser = useCallback((id, updates) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  // Delete user
  const deleteUser = useCallback((id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (currentUserId === id) {
      setCurrentUserId(users[0]?.id || 'user-admin');
    }
  }, [currentUserId, users]);

  // Toggle user status (active/suspended)
  const toggleUserStatus = useCallback((id) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  }, []);

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        currentUserId,
        activeRole,
        switchUser,
        switchRole,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
