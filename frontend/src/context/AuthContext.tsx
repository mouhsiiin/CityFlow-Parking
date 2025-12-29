import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('authToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, _password: string) => {
    // For development: bypass actual login
    // Uncomment below when blockchain backend is ready:
    // const response = await authService.login({ email, password: _password });
    
    const response = {
      token: 'dummy-token',
      user: {
        id: 'user001',
        email,
        firstName: 'Demo',
        lastName: 'User',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        balance: 100.00, // Initial balance for demo
        role: 'user' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
        // Blockchain metadata
        txId: 'demo-tx-' + Date.now(),
        blockNumber: Math.floor(Math.random() * 10000) + 1000,
      },
    };
    localStorage.setItem('authToken', response.token);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const userData = await authService.getProfile();
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
