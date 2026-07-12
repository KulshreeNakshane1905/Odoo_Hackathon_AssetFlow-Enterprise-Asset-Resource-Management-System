import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type UserRole = 'Admin' | 'Asset Manager' | 'Department Head' | 'Employee';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  department_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void; // for admin role switching/demo convenience
  login: (email: string, password_hash: string) => Promise<void>;
  signup: (userData: { first_name: string; last_name: string; email: string; password: string; department_id?: string }) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<string>;
  promoteUser: (userId: string, newRole: UserRole) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'Employee',
  setRole: () => {},
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  forgotPassword: async () => '',
  promoteUser: async () => {},
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<UserRole>('Employee');
  const [loading, setLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const saved = localStorage.getItem('auth-user');
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        setRoleState(parsedUser.role);
      } catch (err) {
        console.error('Failed to parse auth user session:', err);
        localStorage.removeItem('auth-user');
      }
    }
    setLoading(false);
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('auth-user', JSON.stringify(updatedUser));
    }
  };

  const login = async (email: string, password_hash: string) => {
    const res = await api.login(email, password_hash);
    setUser(res);
    setRoleState(res.role);
    localStorage.setItem('auth-user', JSON.stringify(res));
  };

  const signup = async (userData: { first_name: string; last_name: string; email: string; password: string; department_id?: string }) => {
    // Signup defaults to Employee role at API level to prevent privilege escalation
    const res = await api.signup(userData);
    // Auto-login the user after signup
    setUser(res);
    setRoleState(res.role);
    localStorage.setItem('auth-user', JSON.stringify(res));
  };

  const logout = () => {
    setUser(null);
    setRoleState('Employee');
    localStorage.removeItem('auth-user');
  };

  const forgotPassword = async (email: string) => {
    const res = await api.forgotPassword(email);
    return res.message;
  };

  const promoteUser = async (userId: string, newRole: UserRole) => {
    if (!user || user.role !== 'Admin') {
      throw new Error('Only administrators can promote users.');
    }
    const updated = await api.promoteUser(userId, newRole, user.email);
    // If updating currently logged in user
    if (user.id === userId) {
      setUser(updated);
      setRoleState(updated.role);
      localStorage.setItem('auth-user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, login, signup, logout, forgotPassword, promoteUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
