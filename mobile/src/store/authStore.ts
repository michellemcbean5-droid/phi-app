import { create } from 'zustand';
import { UserRole, validateJWT } from '../middleware/authMiddleware';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  role: null,
  isAuthenticated: false,
  login: (token) => {
    const payload = validateJWT(token);
    set({
      token,
      role: payload?.role ?? 'Driver',
      isAuthenticated: Boolean(payload),
    });
  },
  logout: () => set({ token: null, role: null, isAuthenticated: false }),
  hasRole: (role) => {
    const currentRole = get().role;
    if (!currentRole) {
      return false;
    }

    const ranks: Record<UserRole, number> = { Driver: 1, Admin: 2, CEO: 3 };
    return ranks[currentRole] >= ranks[role];
  },
}));

export default useAuthStore;
