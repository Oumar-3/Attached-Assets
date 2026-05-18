import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, shopName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = '@boutique_users';
const SESSION_KEY = '@boutique_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const sessionJson = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionJson) {
        setUser(JSON.parse(sessionJson) as User);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : [];
    const found = users.find(u => u.email === email.toLowerCase().trim() && u.password === password);
    if (!found) throw new Error('Email ou mot de passe incorrect');
    const { password: _, ...userData } = found;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
  }

  async function register(name: string, email: string, password: string, shopName: string) {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users: Array<User & { password: string }> = usersJson ? JSON.parse(usersJson) : [];
    const exists = users.find(u => u.email === email.toLowerCase().trim());
    if (exists) throw new Error('Cet email est déjà utilisé');
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      shopName: shopName.trim(),
      password,
    };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    const { password: _, ...userData } = newUser;
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
  }

  async function logout() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
