import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "aimed_portal_auth";

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshSession = async (tokenOverride = null) => {
    const token = tokenOverride || auth?.token;
    if (!token) {
      return null;
    }

    const data = await apiFetch("/auth/me", {}, token);
    const next = {
      token,
      user: data.user,
      permissions: data.permissions || {},
      isAuthenticated: true
    };
    setAuth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  };

  useEffect(() => {
    const hydrateSession = async () => {
      const existing = readStoredAuth();
      if (!existing?.token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        await refreshSession(existing.token);
      } catch (_error) {
        setAuth(null);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsBootstrapping(false);
      }
    };

    hydrateSession();
  }, []);

  const login = async ({ role, position, email, password }) => {
    const selectedPosition = position || role;
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ position: selectedPosition, email, password })
    });
    const session = {
      token: data.token,
      user: data.user,
      permissions: data.permissions || {},
      isAuthenticated: true
    };
    setAuth(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return data.user;
  };

  const register = async ({ role, name, email, password }) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ role, name, email, password })
    });

  const signout = () => {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const forgotPassword = async ({ email, newPassword }) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email, newPassword })
    });

  const changePassword = async ({ oldPassword, newPassword }) =>
    apiFetch(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword })
      },
      auth?.token
    );

  const value = useMemo(
    () => ({
      auth,
      user: auth?.user ?? null,
      permissions: auth?.permissions ?? {},
      token: auth?.token ?? null,
      isAuthenticated: Boolean(auth?.isAuthenticated),
      isBootstrapping,
      login,
      register,
      signout,
      forgotPassword,
      changePassword,
      refreshSession
    }),
    [auth, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
