import { createSlice } from "@reduxjs/toolkit";

// Slice de filtros de turnos: guarda lo que el usuario eligió en "Mis turnos" / "Agenda"
// (período, fecha, estado, profesional y página) para que no se pierda al cambiar de pantalla.
//
// fecha: null significa "sin tocar": la página usa su valor por defecto (hoy en la agenda,
// sin fecha en Mis turnos). "" significa que el usuario limpió la fecha a propósito.
// Así el reducer no necesita consultar la fecha actual y sigue siendo una función pura.
const initialState = {
  periodo: "upcoming", // "upcoming" (próximos) o "all" (todos / historial)
  fecha: null,
  estado: "",
  doctorId: "",
  pagina: 0,
};

const filtrosTurnosSlice = createSlice({
  name: "filtrosTurnos",
  initialState,
  reducers: {
    // Cambiar de pestaña vuelve la fecha a su valor por defecto, como antes.
    cambiarPeriodo: (state, action) => {
      state.periodo = action.payload;
      state.fecha = null;
      state.pagina = 0;
    },

    // Cada filtro nuevo vuelve a la primera página: la página anterior puede no existir.
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

    // "Limpiar filtros" conserva la pestaña elegida.
    limpiarFiltros: (state) => {
      state.fecha = "";
      state.estado = "";
      state.doctorId = "";
      state.pagina = 0;
    },

    // Al iniciar o cerrar sesión: el próximo usuario no hereda los filtros del anterior.
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

// La página se suscribe al objeto completo: devuelve siempre la misma referencia
// mientras ningún filtro cambie, así que no provoca renders de más.
export const selectFiltrosTurnos = (store) => store.filtrosTurnos;

export default filtrosTurnosSlice.reducer;
