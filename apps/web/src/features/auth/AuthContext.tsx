import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { storageKeys } from '@/lib/storage';

import { AuthContext, type AuthContextValue, type AuthStatus } from './authContextValue';
import {
  authService,
  type AuthService,
  type LoginInput,
  type PublicUser,
  type RegisterInput,
  type RestoredSession,
  type SessionNotice,
} from './authService';

interface AuthState {
  user: PublicUser | null;
  status: AuthStatus;
  notice: SessionNotice | null;
  expiresInMs: number | null;
}

interface AuthProviderProps {
  children: ReactNode;
  /** Permite inyectar un servicio con menos iteraciones en pruebas. */
  service?: AuthService;
}

/** setTimeout no admite más de ~24.8 días; la sesión dura 24 h, así que es solo un tope. */
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

const toState = ({ user, notice, expiresInMs }: RestoredSession): AuthState => ({
  user,
  status: user ? 'authenticated' : 'anonymous',
  notice,
  expiresInMs,
});

export function AuthProvider({ children, service = authService }: AuthProviderProps) {
  // LocalStorage es síncrono: la sesión se restaura al montar, sin un render intermedio sin usuario.
  const [state, setState] = useState<AuthState>(() => toState(service.restoreSession()));

  const refreshSession = useCallback(() => {
    const restored = service.restoreSession();
    // Sin sesión antes ni ahora: se conserva el aviso que ya se mostraba.
    setState((current) => (!restored.user && !current.user ? current : toState(restored)));
  }, [service]);

  // Regla 5 con la pestaña abierta: la sesión se revisa al expirar, cuando otra pestaña la
  // cambia y al volver a la pestaña (los timers se retrasan si el equipo se suspende).
  const { expiresInMs } = state;
  useEffect(() => {
    if (expiresInMs === null) return;
    const timer = setTimeout(refreshSession, Math.min(Math.max(expiresInMs, 0), MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [expiresInMs, refreshSession]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      // key null: otra pestaña vació todo el almacenamiento.
      if (event.key === null || event.key === storageKeys.session) refreshSession();
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') refreshSession();
    }

    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshSession]);

  const register = useCallback(
    async (input: RegisterInput) => {
      await service.register(input);
      setState(toState(service.restoreSession()));
    },
    [service],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      await service.login(input);
      setState(toState(service.restoreSession()));
    },
    [service],
  );

  const logout = useCallback(() => {
    service.logout();
    setState({ user: null, status: 'anonymous', notice: null, expiresInMs: null });
  }, [service]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      status: state.status,
      notice: state.notice,
      register,
      login,
      logout,
      refreshSession,
    }),
    [state.user, state.status, state.notice, register, login, logout, refreshSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
