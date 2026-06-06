
import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers } from '@/services/mock/data';

interface AppState {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  isLoggedIn: false,
  login: (username: string) => {
    const user = mockUsers.find(u => u.username === username);
    if (user) {
      set({ currentUser: user, isLoggedIn: true });
      localStorage.setItem('bus_user', JSON.stringify(user));
      return true;
    }
    return false;
  },
  logout: () => {
    set({ currentUser: null, isLoggedIn: false });
    localStorage.removeItem('bus_user');
  },
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

export const initializeAuth = () => {
  const saved = localStorage.getItem('bus_user');
  if (saved) {
    try {
      const user = JSON.parse(saved) as User;
      useAppStore.setState({ currentUser: user, isLoggedIn: true });
    } catch (e) {
      localStorage.removeItem('bus_user');
    }
  }
};
