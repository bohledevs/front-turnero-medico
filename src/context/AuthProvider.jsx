import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { reiniciarFiltrosTurnos } from "../store/slices/filtrosTurnosSlice";
import {
  cerrarSesion,
  selectEstadoSesion,
  selectUsuario,
  sesionVencida,
} from "../store/slices/authSlice";
import { cambiarUsuarioFavoritos } from "../store/slices/favoritosSlice";
import { leerFavoritos } from "../store/favoritosStorage";

// Efectos de la sesión que no son de ninguna pantalla en particular.
// El estado está en el authSlice; la sesión se restaura al arrancar (main.jsx).
export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const usuario = useSelector(selectUsuario);
  const estado = useSelector(selectEstadoSesion);
  const userId = usuario?.id;
  const expiresAt = usuario?.expiresAt;

  // Cuando cambia quién está logueado (ingreso, cierre o vencimiento de la sesión),
  // los filtros de turnos vuelven a su valor inicial.
  useEffect(() => {
    dispatch(reiniciarFiltrosTurnos());
  }, [dispatch, userId]);

  // Y se cargan los favoritos de esa cuenta. Mientras se recupera la sesión después de un F5
  // todavía no se sabe de quién son, así que se espera en lugar de mostrar los de invitado.
  useEffect(() => {
    if (estado === "verificando") return;
    dispatch(
      cambiarUsuarioFavoritos({ usuarioId: userId ?? null, items: leerFavoritos(userId) }),
    );
  }, [dispatch, userId, estado]);

  // La capa de API avisa con eventos: 401 en una ruta protegida o cambio de fuente de datos.
  useEffect(() => {
    const expire = () => dispatch(sesionVencida());
    const logout = () => dispatch(cerrarSesion());
    window.addEventListener("turnera:expired", expire);
    window.addEventListener("turnera:logout", logout);
    return () => {
      window.removeEventListener("turnera:expired", expire);
      window.removeEventListener("turnera:logout", logout);
    };
  }, [dispatch]);

  // Cuando se cumple el vencimiento del JWT, se avisa sin esperar al próximo pedido.
  useEffect(() => {
    if (!expiresAt) return undefined;
    const timer = setTimeout(
      () => dispatch(sesionVencida()),
      Math.max(0, expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [dispatch, expiresAt]);

  return children;
}
