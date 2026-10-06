import { createContext } from 'react';

import type { LoginInput, PublicUser, RegisterInput, SessionNotice } from './authService';

export type AuthStatus = 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  /** Por qué se descartó la última sesión guardada (expiró o datos ilegibles), o null. */
  notice: SessionNotice | null;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  /** Vuelve a leer la sesión guardada; si ya no es válida, pasa a anónimo con su aviso. */
  refreshSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
