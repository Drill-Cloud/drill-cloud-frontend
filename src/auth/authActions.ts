import type { KeycloakInitOptions } from 'keycloak-js';
import { keycloak } from './keycloakClient';
import { getAuthState, getIdentityState, setAuthState, type AuthState } from './authStore';

let initPromise: Promise<boolean> | null = null;
let refreshPromise: Promise<string | null> | null = null;

/** Инициализирует Keycloak один раз и запускает login-required flow при включенном SSO. */
export async function initAuth(): Promise<AuthState> {
  if (!keycloak) {
    return getAuthState();
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
  return getAuthState();
}

/** Обновляет access token перед API-запросами и повторно использует текущий refresh-promise. */
export async function refreshToken(minValidity = 30): Promise<string | null> {
  if (!keycloak) {
    return null;
  }

  const client = keycloak;

  if (!refreshPromise) {
    refreshPromise = client
      .updateToken(minValidity)
      .then(() => {
        setAuthState({
          authenticated: Boolean(client.authenticated),
          ...getIdentityState(),
        });

        return client.token ?? null;
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
