import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AuthContext } from "./auth";
import { api, getSession, saveSession } from "../services/api";
import { reiniciarFiltrosTurnos } from "../store/slices/filtrosTurnosSlice";
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession);
  const [expired, setExpired] = useState(false);
  const dispatch = useDispatch();
  const userId = user?.id;
  // Cuando cambia quién está logueado (ingreso, cierre o vencimiento de la sesión),
  // los filtros de turnos vuelven a su valor inicial.
  useEffect(() => {
    dispatch(reiniciarFiltrosTurnos());
  }, [dispatch, userId]);
  useEffect(() => {
    const expire = () => {
      saveSession(null);
      setUser(null);
      setExpired(true);
    };
    const logout = () => {
      saveSession(null);
      setUser(null);
    };
    window.addEventListener("turnera:expired", expire);
    window.addEventListener("turnera:logout", logout);
    const timer = user
      ? setTimeout(expire, Math.max(0, user.expiresAt - Date.now()))
      : null;
    return () => {
      window.removeEventListener("turnera:expired", expire);
      window.removeEventListener("turnera:logout", logout);
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
