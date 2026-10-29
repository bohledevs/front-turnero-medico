import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { clearFavorites } from "../store/slices/favoriteSlice.js";
import { AuthContext } from "./auth";
import { api, getSession, saveSession } from "../services/api";
export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [user, setUser] = useState(getSession);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const expire = () => {
      dispatch(clearFavorites());
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
  }, [user, dispatch]);
  async function login(values) {
    const data = await api.login(values);
    const session = { ...data, expiresAt: Date.now() + data.expiresIn * 1000 };
    dispatch(clearFavorites());
    saveSession(session);
    setUser(session);
    setExpired(false);
    return session;
  }
  function logout() {
    dispatch(clearFavorites());
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
