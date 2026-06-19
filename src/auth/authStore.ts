import { authEnabled, keycloak } from './keycloakClient';

export type AuthState = {
  initialized: boolean;
  authenticated: boolean;
  enabled: boolean;
  username: string | null;
  fullName: string | null;
  email: string | null;
};

type AuthListener = (state: AuthState) => void;

const defaultState: AuthState = {
  initialized: !authEnabled,
  authenticated: !authEnabled,
  enabled: authEnabled,
  username: null,
  fullName: null,
  email: null,
};

let authState = defaultState;
const listeners = new Set<AuthListener>();

/** Извлекает пользовательскую идентичность из распарсенного Keycloak-токена. */
export function getIdentityState(): Pick<AuthState, 'username' | 'fullName' | 'email'> {
  const tokenParsed = keycloak?.tokenParsed as
    | { preferred_username?: string; name?: string; email?: string }
    | undefined;

  return {
    username: tokenParsed?.preferred_username ?? null,
    fullName: tokenParsed?.name ?? null,
    email: tokenParsed?.email ?? null,
  };
}

/** Обновляет auth-состояние и уведомляет все React-подписки. */
export function setAuthState(partial: Partial<AuthState>) {
  authState = { ...authState, ...partial };
  listeners.forEach((listener) => listener(authState));
}

/** Возвращает актуальный снимок auth-состояния без подписки. */
export function getAuthState(): AuthState {
  return authState;
}

/** Подписывает UI на изменения Keycloak-сессии и возвращает функцию отписки. */
export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  listener(authState);

  return () => {
    listeners.delete(listener);
  };
}
