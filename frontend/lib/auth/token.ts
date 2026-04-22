const TOKEN_KEYS = ["accessToken", "token", "access_token"] as const;
const PRIMARY_TOKEN_KEY = "accessToken";

export function getAccessTokenFromStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export function setAccessTokenToStorage(token: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PRIMARY_TOKEN_KEY, token);
}

export function clearAccessTokenFromStorage() {
  if (typeof window === "undefined") {
    return;
  }
  for (const key of TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
}
