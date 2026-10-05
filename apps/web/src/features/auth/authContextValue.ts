import { createContext } from 'react';

import type { LoginInput, PublicUser, RegisterInput } from './authService';

export type AuthStatus = 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  /** La última sesión guardada se descartó por haber expirado. */
  sessionExpired: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
