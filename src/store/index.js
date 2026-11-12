import { configureStore } from "@reduxjs/toolkit";
import favoritosReducer from "./slices/favoritosSlice";
import filtrosTurnosReducer from "./slices/filtrosTurnosSlice";
import { getSession } from "../services/api";
import {
  descartarFavoritosCompartidos,
  guardarFavoritos,
  leerFavoritos,
} from "./favoritosStorage";

descartarFavoritosCompartidos();

// Al recargar la página arrancamos con los favoritos de quien tiene la sesión abierta.
// Cuando cambia el usuario, AuthProvider carga los de la nueva cuenta.
const usuarioInicial = getSession()?.id ?? null;

// Store único: acá vive todo el estado global de la app.
// Cada slice es una porción (favoritos y filtros de turnos ahora; usuario, etc. más adelante).
// Los filtros de turnos no se guardan en el navegador: duran mientras la pestaña esté abierta.
export const store = configureStore({
  reducer: {
    favoritos: favoritosReducer,
    filtrosTurnos: filtrosTurnosReducer,
  },
  preloadedState: {
    favoritos: { usuarioId: usuarioInicial, items: leerFavoritos(usuarioInicial) },
  },
});

// Cada vez que cambian los favoritos, los guardamos en el navegador bajo la clave de su dueño.
// Los cambios de otros slices (por ejemplo, los filtros) no escriben nada.
let favoritosGuardados = store.getState().favoritos;
store.subscribe(() => {
  const favoritos = store.getState().favoritos;
  if (favoritos === favoritosGuardados) return;
  favoritosGuardados = favoritos;
  guardarFavoritos(favoritos.usuarioId, favoritos.items);
});
