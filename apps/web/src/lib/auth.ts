import axios, { type AxiosRequestConfig } from "axios";

const API_BASE = "http://localhost:4000/api/v1";
const AUTH_TOKEN_KEY = "amp_auth_token";
const AUTH_USER_KEY = "amp_auth_user";

export type AuthUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
};

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  },
);

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(AUTH_USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export async function loginWithEmail(email: string, password: string) {
  const response = await api.post<{ access_token: string; user: AuthUser }>(
    "/auth/login",
    { email, password },
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const payload = response.data;
  setAuthSession(payload.access_token, payload.user);
  return payload.user;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const response = await api.get<{ user?: AuthUser }>("/auth/me");
    const payload = response.data;

    if (!payload.user) {
      clearAuthSession();
      return null;
    }

    setAuthSession(token, payload.user);
    return payload.user;
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function apiFetch(input: string, init: AxiosRequestConfig = {}) {
  const config: AxiosRequestConfig = {
    ...init,
    url: input,
    headers: {
      ...(init.headers ?? {}),
    },
  };

  const response = await api.request(config);
  return response;
}
