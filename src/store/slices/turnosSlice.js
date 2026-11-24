import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api.js";

function toError(error) {
  return {
    message: error?.message || "No se pudo completar la operación.",
    status: error?.status || 0,
    fieldErrors: error?.fieldErrors || {},
  };
}

export const consultarDisponibilidad = createAsyncThunk(
  "turnos/consultarDisponibilidad",
  async (filtros, { signal, rejectWithValue }) => {
    try {
      return await api.availability(filtros, signal);
    } catch (error) {
      return rejectWithValue(toError(error));
    }
  },
);

export const reservarTurno = createAsyncThunk(
  "turnos/reservar",
  async (datos, { rejectWithValue }) => {
    try {
      return await api.reserve(datos);
    } catch (error) {
      return rejectWithValue(toError(error));
    }
  },
);

export const listarTurnos = createAsyncThunk(
  "turnos/listar",
  async (filtros, { signal, rejectWithValue }) => {
    try {
      return await api.appointments(filtros, signal);
    } catch (error) {
      return rejectWithValue(toError(error));
    }
  },
);

export const cambiarEstadoTurno = createAsyncThunk(
  "turnos/cambiarEstado",
  async ({ id, datos }, { rejectWithValue }) => {
    try {
      return await api.changeStatus(id, datos);
    } catch (error) {
      return rejectWithValue(toError(error));
    }
  },
);

export const crearSobreturno = createAsyncThunk(
  "turnos/crearSobreturno",
  async (datos, { rejectWithValue }) => {
    try {
      return await api.extraAppointment(datos);
    } catch (error) {
      return rejectWithValue(toError(error));
    }
  },
);

const initialState = {
  data: null,
  loading: false,
  error: null,
  disponibilidad: [],
  disponibilidadLoading: false,
  disponibilidadError: null,
  reserva: null,
  reservaLoading: false,
  reservaError: null,
  operacionLoading: false,
  operacionError: null,
};

const turnosSlice = createSlice({
  name: "turnos",
  initialState,
  reducers: {
    limpiarErrorReserva: (state) => {
      state.reservaError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(consultarDisponibilidad.pending, (state) => {
        state.disponibilidadLoading = true;
        state.disponibilidadError = null;
      })
      .addCase(consultarDisponibilidad.fulfilled, (state, action) => {
        state.disponibilidadLoading = false;
        state.disponibilidad = action.payload;
      })
      .addCase(consultarDisponibilidad.rejected, (state, action) => {
        state.disponibilidadLoading = false;
        state.disponibilidadError = action.payload || action.error;
      })

      .addCase(reservarTurno.pending, (state) => {
        state.reservaLoading = true;
        state.reservaError = null;
      })
      .addCase(reservarTurno.fulfilled, (state, action) => {
        state.reservaLoading = false;
        state.reserva = action.payload;
        state.disponibilidad = state.disponibilidad.filter(
          (slot) => slot.fechaHoraInicio !== action.payload.fechaHoraInicio,
        );
      })
      .addCase(reservarTurno.rejected, (state, action) => {
        state.reservaLoading = false;
        state.reservaError = action.payload || action.error;
      })

      .addCase(listarTurnos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listarTurnos.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(listarTurnos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      })

      .addCase(cambiarEstadoTurno.pending, (state) => {
        state.operacionLoading = true;
        state.operacionError = null;
      })
      .addCase(cambiarEstadoTurno.fulfilled, (state, action) => {
        state.operacionLoading = false;
        if (state.data?.content) {
          state.data.content = state.data.content.map((turno) =>
            turno.id === action.payload.id ? action.payload : turno,
          );
        }
      })
      .addCase(cambiarEstadoTurno.rejected, (state, action) => {
        state.operacionLoading = false;
        state.operacionError = action.payload || action.error;
      })

      .addCase(crearSobreturno.pending, (state) => {
        state.operacionLoading = true;
        state.operacionError = null;
      })
      .addCase(crearSobreturno.fulfilled, (state) => {
        state.operacionLoading = false;
      })
      .addCase(crearSobreturno.rejected, (state, action) => {
        state.operacionLoading = false;
        state.operacionError = action.payload || action.error;
      });
  },
});

export const { limpiarErrorReserva } = turnosSlice.actions;

export const selectTurnos = (state) => state.turnos.data;
export const selectTurnosLoading = (state) => state.turnos.loading;
export const selectTurnosError = (state) => state.turnos.error;
export const selectDisponibilidad = (state) => state.turnos.disponibilidad;
export const selectDisponibilidadLoading = (state) =>
  state.turnos.disponibilidadLoading;
export const selectDisponibilidadError = (state) =>
  state.turnos.disponibilidadError;
export const selectReservaLoading = (state) => state.turnos.reservaLoading;
export const selectReservaError = (state) => state.turnos.reservaError;
export const selectOperacionTurnosLoading = (state) =>
  state.turnos.operacionLoading;

export default turnosSlice.reducer;
