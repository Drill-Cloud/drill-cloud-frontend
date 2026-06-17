import { createContext, useContext } from 'react';
import type { AuthState } from './keycloak';

export type AuthContextValue = AuthState & {
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Дает компонентам доступ к данным пользователя и действиям login/logout. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
