const TOKEN_KEYS = ["accessToken", "token", "access_token"] as const;
const PRIMARY_TOKEN_KEY = "accessToken";
const AUTH_USER_PROFILE_KEY = "authUserProfile";

export type AuthUserProfile = {
  userId: number;
  email: string;
  nickname: string;
  gender?: "MALE" | "FEMALE";
};

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

export function setAuthUserProfileToStorage(profile: AuthUserProfile) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_USER_PROFILE_KEY, JSON.stringify(profile));
}

export function getAuthUserProfileFromStorage(): AuthUserProfile | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_USER_PROFILE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUserProfile;
  } catch {
    return null;
  }
}

export function clearAccessTokenFromStorage() {
  if (typeof window === "undefined") {
    return;
  }
  for (const key of TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem(AUTH_USER_PROFILE_KEY);
}