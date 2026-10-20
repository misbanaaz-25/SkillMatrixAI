import { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  clearSession,
  getMe,
  getStoredUser,
  getToken,
  login as apiLogin,
  saveSession,
  signup as apiSignup,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [checking, setChecking] = useState(() => Boolean(getToken()));

  // after login/signup: save the token, then make sure we have the user details
  const startSession = useCallback(async (data) => {
    const token = data.access_token || data.token;
    if (!token) {
      throw new Error("Login failed: no token received from the server.");
    }

    saveSession(token, data.user ?? null);
    let currentUser = data.user;
    if (!currentUser) {
      currentUser = await getMe();
      saveSession(token, currentUser);
    }
    setUser(currentUser);
    return currentUser;
  }, []);

  const login = useCallback(
    async (email, password) => startSession(await apiLogin(email, password)),
    [startSession]
  );

  const signup = useCallback(
    async (name, email, password) => startSession(await apiSignup(name, email, password)),
    [startSession]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // on page load: confirm the saved token is still valid
  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then((freshUser) => {
        saveSession(getToken(), freshUser);
        setUser(freshUser);
      })
      .catch(() => {
        // a 401 already clears the session via the auth:expired event
      })
      .finally(() => setChecking(false));
  }, []);

  // api.js fires this when the server rejects the saved token
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  const value = { user, checking, isLoggedIn: Boolean(user), login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}