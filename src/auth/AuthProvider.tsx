import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { AuthContext, type AuthContextValue } from './authContext';
import { type AuthState, getAuthState, initAuth, login, logout, subscribeAuth } from './keycloak';

/** Оборачивает приложение auth-состоянием и показывает системные экраны Keycloak-инициализации. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(getAuthState());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAuth(setState);

    void initAuth().catch((error) => {
      console.error('Keycloak init failed', error);
      setErrorMessage('Не удалось подключиться к Keycloak. Проверьте VITE_KEYCLOAK_* и настройки клиента в SSO.');
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: () => login(),
      logout: () => logout(),
    }),
    [state],
  );

  if (!state.initialized) {
    return (
      <div className="auth-screen">
        <div className="auth-screen-card">
          <h1>Drill UI</h1>
          <p>Проверяем сессию Keycloak...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="auth-screen">
        <div className="auth-screen-card">
          <h1>Ошибка авторизации</h1>
          <p>{errorMessage}</p>
          <button type="button" className="auth-screen-button" onClick={() => void login()}>
            Повторить вход
          </button>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
