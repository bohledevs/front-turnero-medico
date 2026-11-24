import { createSlice } from "@reduxjs/toolkit";

// Slice creado en el PR #7: conserva los filtros al navegar entre pantallas.
// fecha null permite que cada vista use su valor por defecto.
const initialState = {
  periodo: "upcoming",
  fecha: null,
  estado: "",
  doctorId: "",
  pagina: 0,
};

const filtrosTurnosSlice = createSlice({
  name: "filtrosTurnos",
  initialState,
  reducers: {
    cambiarPeriodo: (state, action) => {
      state.periodo = action.payload;
      state.fecha = null;
      state.pagina = 0;
    },
    cambiarFecha: (state, action) => {
      state.fecha = action.payload;
      state.pagina = 0;
    },
    cambiarEstado: (state, action) => {
      state.estado = action.payload;
      state.pagina = 0;
    },
    cambiarProfesional: (state, action) => {
      state.doctorId = action.payload;
      state.pagina = 0;
    },
    cambiarPagina: (state, action) => {
      state.pagina = action.payload;
    },
    limpiarFiltros: (state) => {
      state.fecha = "";
      state.estado = "";
      state.doctorId = "";
      state.pagina = 0;
    },
    reiniciarFiltrosTurnos: () => initialState,
  },
});

export const {
  cambiarPeriodo,
  cambiarFecha,
  cambiarEstado,
  cambiarProfesional,
  cambiarPagina,
  limpiarFiltros,
  reiniciarFiltrosTurnos,
} = filtrosTurnosSlice.actions;

export const selectFiltrosTurnos = (state) => state.filtrosTurnos;

export default filtrosTurnosSlice.reducer;
