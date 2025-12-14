import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'admin' | 'employee';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@cafeconnect.com',
    phone: '9876543210',
    address: '123 Admin Street, City',
    role: 'admin',
    password: 'admin123',
  },
  {
    id: '2',
    name: 'John Employee',
    email: 'john@cafeconnect.com',
    phone: '9876543211',
    address: '456 Employee Lane, City',
    role: 'employee',
    password: 'employee123',
  },
  {
    id: '3',
    name: 'Jane Employee',
    email: 'jane@cafeconnect.com',
    phone: '9876543212',
    address: '789 Worker Ave, City',
    role: 'employee',
    password: 'employee123',
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('cafeconnect_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('cafeconnect_user', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cafeconnect_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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

export { mockUsers };
