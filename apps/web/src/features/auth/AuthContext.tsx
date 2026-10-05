import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { AuthContext, type AuthContextValue, type AuthStatus } from './authContextValue';
import {
  authService,
  type AuthService,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
} from './authService';

interface AuthState {
  user: PublicUser | null;
  status: AuthStatus;
  sessionExpired: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
  /** Permite inyectar un servicio con menos iteraciones en pruebas. */
  service?: AuthService;
}

export function AuthProvider({ children, service = authService }: AuthProviderProps) {
  // LocalStorage es síncrono: la sesión se restaura al montar, sin un render intermedio sin usuario.
  const [state, setState] = useState<AuthState>(() => {
    const { user, expired } = service.restoreSession();
    return { user, status: user ? 'authenticated' : 'anonymous', sessionExpired: expired };
  });

  const register = useCallback(
    async (input: RegisterInput) => {
      const user = await service.register(input);
      setState({ user, status: 'authenticated', sessionExpired: false });
    },
    [service],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const user = await service.login(input);
      setState({ user, status: 'authenticated', sessionExpired: false });
    },
    [service],
  );

  const logout = useCallback(() => {
    service.logout();
    setState({ user: null, status: 'anonymous', sessionExpired: false });
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, register, login, logout }),
    [state, register, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
