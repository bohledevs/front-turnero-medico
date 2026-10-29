import { createSlice } from "@reduxjs/toolkit";

// Un solo listado compartido; la cantidad se calcula desde items para no duplicarla.
const favoriteSlice = createSlice({
  name: "favorites",
  initialState: { items: [] },
  reducers: {
    /** Agrega un profesional una sola vez, aunque el id llegue como texto. */
    addFavorite(state, action) {
      const doctor = action.payload;
      const exists = state.items.some(
        (item) => String(item.id) === String(doctor.id),
      );
      if (!exists) {
        // Dentro de createSlice, Immer convierte esta escritura en un cambio inmutable.
        state.items.push(doctor);
      }
    },
    /** Quita el profesional identificado por el id recibido en action.payload. */
    removeFavorite(state, action) {
      state.items = state.items.filter(
        (item) => String(item.id) !== String(action.payload),
      );
    },
    /** Vacía la selección al pedirlo o al cambiar de sesión. */
    clearFavorites(state) {
      state.items = [];
    },
  },
});

export const { addFavorite, removeFavorite, clearFavorites } =
  favoriteSlice.actions;
export default favoriteSlice.reducer;

// Cada componente se suscribe únicamente al dato que necesita.
export const selectFavorites = (state) => state.favorites.items;
export const selectFavoriteCount = (state) => state.favorites.items.length;
export const selectIsFavorite = (state, doctorId) =>
  state.favorites.items.some((item) => String(item.id) === String(doctorId));
