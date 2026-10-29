import { configureStore } from "@reduxjs/toolkit";
import favoriteReducer from "./slices/favoriteSlice.js";

/** Crea el estado global de la aplicación con el middleware por defecto de RTK. */
export function createAppStore() {
  return configureStore({
    reducer: { favorites: favoriteReducer },
  });
}

export const store = createAppStore();
