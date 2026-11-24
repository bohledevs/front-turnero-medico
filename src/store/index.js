import { configureStore } from "@reduxjs/toolkit";
import favoritosReducer from "./slices/favoritosSlice";
import doctoresReducer from "./slices/doctoresSlice";
import filtrosTurnosReducer from "./slices/filtrosTurnosSlice";
import turnosReducer from "./slices/turnosSlice";

const STORAGE_KEY = "turnera.favoritos";

// Recupera los favoritos guardados para que no se pierdan al recargar la página
function cargarFavoritos() {
  try {
    const guardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(guardados)
      ? { favoritos: { items: guardados } }
      : undefined;
  } catch {
    return undefined;
  }
}

// Store único: acá vive todo el estado global de la app.
// Cada slice es una porción (favoritos ahora; usuario, turnos, etc. más adelante).
export const store = configureStore({
  reducer: {
    favoritos: favoritosReducer,
    doctores: doctoresReducer,
    filtrosTurnos: filtrosTurnosReducer,
    turnos: turnosReducer,
  },
  preloadedState: cargarFavoritos(),
});

// Cada vez que cambia el store, guardamos los favoritos en el navegador
store.subscribe(() => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(store.getState().favoritos.items),
    );
  } catch {
    // si el navegador bloquea el almacenamiento, la app sigue funcionando
  }
});
