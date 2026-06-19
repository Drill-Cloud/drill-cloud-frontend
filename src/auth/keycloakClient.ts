import Keycloak from 'keycloak-js';
import { keycloakClientId, keycloakRealm, keycloakUrl } from '../shared/config/env';

export const authEnabled = Boolean(keycloakUrl && keycloakRealm && keycloakClientId);

export const keycloak = authEnabled
  ? new Keycloak({
      url: keycloakUrl as string,
      realm: keycloakRealm as string,
      clientId: keycloakClientId as string,
    })
  : null;
