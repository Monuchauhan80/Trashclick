import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types/User';
import { loginUser as loginUserService, logoutUser as logoutUserService } from '../services/authService';

interface UserContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<boolean>;
  updateUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, initialUser }) => {
  const [user, setUser] = useState<User | null>(initialUser);

  const login = async (email: string, password: string) => {
    const loggedInUser = await loginUserService(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    return loggedInUser;
  };

  const logout = async () => {
    const success = await logoutUserService();
    if (success) {
      setUser(null);
    }
    return success;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 