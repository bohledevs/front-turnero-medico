import { createSelector, createSlice } from "@reduxjs/toolkit";

// Slice de favoritos: una porción del store global.
// Guarda los profesionales que el paciente marcó como favoritos
// y las funciones (reducers) que modifican esa lista.
const favoritosSlice = createSlice({
  name: "favoritos",
  initialState: {
    items: [], // profesionales favoritos: { id, nombre, apellido, especialidadNombre, ... }
  },
  reducers: {
    // dispatch(agregarFavorito(doctor)) -> action.payload = doctor
    agregarFavorito: (state, action) => {
      const doctor = action.payload;
      const yaEsta = state.items.some((item) => item.id === doctor.id);
      if (!yaEsta) {
        state.items.push(doctor);
      }
    },

    // dispatch(quitarFavorito(doctorId)) -> action.payload = id del doctor
    quitarFavorito: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },

    // dispatch(toggleFavorito(doctor)) -> si está lo saca, si no está lo agrega
    toggleFavorito: (state, action) => {
      const doctor = action.payload;
      const existe = state.items.some((item) => item.id === doctor.id);
      if (existe) {
        state.items = state.items.filter((item) => item.id !== doctor.id);
      } else {
        state.items.push(doctor);
      }
    },

    // dispatch(vaciarFavoritos())
    vaciarFavoritos: (state) => {
      state.items = [];
    },
  },
});

// Acciones para usar con dispatch desde los componentes
export const { agregarFavorito, quitarFavorito, toggleFavorito, vaciarFavoritos } =
  favoritosSlice.actions;

// Selectores: cada componente elige a qué parte del estado se suscribe con useSelector
export const selectFavoritos = (store) => store.favoritos.items;
export const selectCantidadFavoritos = (store) => store.favoritos.items.length;

// Selectores memoizados con createSelector: solo recalculan cuando cambia la lista de favoritos.
// Devuelven objetos nuevos (un Set, un array); sin memoizar, useSelector vería un resultado
// distinto (!==) después de cada dispatch, de cualquier slice, y re-renderizaría siempre.

// Ids de los favoritos en un Set, para consultar "¿es favorito?" sin recorrer la lista.
export const selectIdsFavoritos = createSelector(
  [selectFavoritos],
  (items) => new Set(items.map((item) => item.id)),
);

export const selectEsFavorito = (doctorId) => (store) =>
  selectIdsFavoritos(store).has(doctorId);

// Favoritos agrupados por especialidad, ordenados alfabéticamente: [{ especialidad, doctores }]
export const selectFavoritosPorEspecialidad = createSelector(
  [selectFavoritos],
  (items) => {
    const grupos = new Map();
    for (const doctor of items) {
      const especialidad = doctor.especialidadNombre || "Sin especialidad";
      if (!grupos.has(especialidad)) grupos.set(especialidad, []);
      grupos.get(especialidad).push(doctor);
    }
    return [...grupos.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "es"))
      .map(([especialidad, doctores]) => ({ especialidad, doctores }));
  },
);

// El reducer se registra en el store (store/index.js)
export default favoritosSlice.reducer;
