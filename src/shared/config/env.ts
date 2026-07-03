/** Базовый путь cloud API; маршрутизация на бэкенд — на уровне реверс-прокси. */
export const cloudApiUrl = '/api';
export const diagramApiUrl = import.meta.env.VITE_DIAGRAM_API_URL as string;
export const toirLightOrigin = import.meta.env.VITE_TOIR_LIGHT_ORIGIN as string;
export const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
export const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM;
export const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
