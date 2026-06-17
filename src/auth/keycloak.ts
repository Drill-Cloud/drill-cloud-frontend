import Keycloak, { type KeycloakInitOptions } from 'keycloak-js';

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM;
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

const authEnabled = Boolean(keycloakUrl && keycloakRealm && keycloakClientId);

const keycloak = authEnabled
  ? new Keycloak({
      url: keycloakUrl!,
      realm: keycloakRealm!,
      clientId: keycloakClientId!,
    })
  : null;

let initPromise: Promise<boolean> | null = null;
let refreshPromise: Promise<string | null> | null = null;

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
function getIdentityState(): Pick<AuthState, 'username' | 'fullName' | 'email'> {
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
function setAuthState(partial: Partial<AuthState>) {
  authState = { ...authState, ...partial };
  listeners.forEach((listener) => listener(authState));
}

if (keycloak) {
  keycloak.onAuthSuccess = () => {
    setAuthState({
      initialized: true,
      authenticated: true,
      ...getIdentityState(),
    });
  };

  keycloak.onAuthLogout = () => {
    setAuthState({
      initialized: true,
      authenticated: false,
      username: null,
      fullName: null,
      email: null,
    });
  };

  keycloak.onTokenExpired = () => {
    void refreshToken(30);
  };
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

/** Инициализирует Keycloak один раз и запускает login-required flow при включенном SSO. */
export async function initAuth(): Promise<AuthState> {
  if (!keycloak) {
    return authState;
  }

  if (!initPromise) {
    const initOptions: KeycloakInitOptions = {
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    };

    initPromise = keycloak.init(initOptions).then((authenticated) => {
      setAuthState({
        initialized: true,
        authenticated,
        ...getIdentityState(),
      });

      return authenticated;
    });
  }

  await initPromise;
  return authState;
}

/** Обновляет access token перед API-запросами и повторно использует текущий refresh-promise. */
export async function refreshToken(minValidity = 30): Promise<string | null> {
  if (!keycloak) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = keycloak
      .updateToken(minValidity)
      .then(() => {
        setAuthState({
          authenticated: Boolean(keycloak.authenticated),
          ...getIdentityState(),
        });

        return keycloak.token ?? null;
      })
      .catch(async () => {
        setAuthState({
          authenticated: false,
          username: null,
          fullName: null,
          email: null,
        });

        await login();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

/** Возвращает действующий access token или null, если SSO отключен/пользователь не вошел. */
export async function getAccessToken(): Promise<string | null> {
  if (!keycloak?.authenticated) {
    return null;
  }

  await refreshToken(30);
  return keycloak.token ?? null;
}

/** Запускает ручной вход через Keycloak с возвратом на текущий адрес. */
export async function login(redirectUri = window.location.href): Promise<void> {
  await keycloak?.login({ redirectUri });
}

/** Завершает Keycloak-сессию и возвращает пользователя на origin приложения. */
export async function logout(redirectUri = window.location.origin): Promise<void> {
  await keycloak?.logout({ redirectUri });
}
