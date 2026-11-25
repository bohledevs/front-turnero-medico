import { configureStore } from "@reduxjs/toolkit";
import favoritosReducer from "./slices/favoritosSlice";
import filtrosTurnosReducer from "./slices/filtrosTurnosSlice";

const STORAGE_KEY = "turnera.favoritos";

// Recupera los favoritos guardados para que no se pierdan al recargar la página
function cargarFavoritos() {
  try {
    const guardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(guardados) ? { favoritos: { items: guardados } } : undefined;
  } catch {
    return undefined;
  }
}

// Store único: acá vive todo el estado global de la app.
// Cada slice es una porción (favoritos y filtros de turnos ahora; usuario, etc. más adelante).
// Los filtros de turnos no se guardan en el navegador: duran mientras la pestaña esté abierta.
export const store = configureStore({
  reducer: {
    favoritos: favoritosReducer,
    filtrosTurnos: filtrosTurnosReducer,
  },
  preloadedState: cargarFavoritos(),
});

// Cada vez que cambia el store, guardamos los favoritos en el navegador
store.subscribe(() => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState().favoritos.items));
  } catch {
    // si el navegador bloquea el almacenamiento, la app sigue funcionando
  }
});
