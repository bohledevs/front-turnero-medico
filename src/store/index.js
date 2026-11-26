import { configureStore } from "@reduxjs/toolkit";
import favoritosReducer from "./slices/favoritosSlice";
import filtrosTurnosReducer from "./slices/filtrosTurnosSlice";
import authReducer from "./slices/authSlice";
import { descartarFavoritosCompartidos, guardarFavoritos } from "./favoritosStorage";

descartarFavoritosCompartidos();

// Los favoritos arrancan sin dueño: al cargar la página todavía no sabemos quién está logueado
// (la sesión se recupera desde la cookie). AuthProvider carga la lista de esa cuenta cuando se sabe.

// Store único: acá vive todo el estado global de la app.
// Cada slice es una porción (sesión, favoritos y filtros de turnos).
// Los filtros de turnos no se guardan en el navegador: duran mientras la pestaña esté abierta.
// La sesión tampoco: al recargar se recupera desde la cookie HttpOnly con restaurarSesion.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    favoritos: favoritosReducer,
    filtrosTurnos: filtrosTurnosReducer,
  },
});

// Cada vez que cambian los favoritos, los guardamos en el navegador bajo la clave de su dueño.
// Los cambios de otros slices (por ejemplo, los filtros) no escriben nada.
let favoritosGuardados = store.getState().favoritos;
store.subscribe(() => {
  const favoritos = store.getState().favoritos;
  if (favoritos === favoritosGuardados) return;
  favoritosGuardados = favoritos;
  guardarFavoritos(favoritos.duenio, favoritos.items);
});
