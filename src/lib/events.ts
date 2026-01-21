export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'

export function emitAuthUnauthorized() {
  window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
}
