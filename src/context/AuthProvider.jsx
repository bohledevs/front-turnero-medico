import { useEffect, useState } from "react";
import { AuthContext } from "./auth";
import { api, getSession, saveSession } from "../services/api";
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const expire = () => {
      saveSession(null);
      setUser(null);
      setExpired(true);
    };
    window.addEventListener("turnera:expired", expire);
    const timer = user
      ? setTimeout(expire, Math.max(0, user.expiresAt - Date.now()))
      : null;
    return () => {
      window.removeEventListener("turnera:expired", expire);
      clearTimeout(timer);
    };
  }, [user]);
  async function login(values) {
    const data = await api.login(values);
    const session = { ...data, expiresAt: Date.now() + data.expiresIn * 1000 };
    saveSession(session);
    setUser(session);
    setExpired(false);
    return session;
  }
  function logout() {
    saveSession(null);
    setUser(null);
    setExpired(false);
  }
  return (
    <AuthContext.Provider value={{ user, login, logout, expired }}>
      {children}
    </AuthContext.Provider>
  );
}
