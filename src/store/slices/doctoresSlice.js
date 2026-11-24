import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api.js";

function errorPayload(error) {
  return {
    message: error?.message || "No se pudo completar la operación.",
    status: error?.status || 0,
    fieldErrors: error?.fieldErrors || {},
  };
}

export const listarDoctores = createAsyncThunk(
  "doctores/listar",
  async (_, { signal, rejectWithValue }) => {
    try {
      return await api.doctors({}, signal);
    } catch (error) {
      return rejectWithValue(errorPayload(error));
    }
  },
);

export const buscarDoctores = createAsyncThunk(
  "doctores/buscar",
  async (filtros, { signal, rejectWithValue }) => {
    try {
      return await api.doctors(filtros, signal);
    } catch (error) {
      return rejectWithValue(errorPayload(error));
    }
  },
);

export const obtenerDoctorPorId = createAsyncThunk(
  "doctores/obtenerPorId",
  async (id, { signal, rejectWithValue }) => {
    try {
      const doctores = await api.doctors({}, signal);
      const doctor = doctores.find((item) => String(item.id) === String(id));

      if (!doctor) {
        return rejectWithValue({
          message: "No pudimos encontrar este profesional.",
          status: 404,
          fieldErrors: {},
        });
      }

      return doctor;
    } catch (error) {
      return rejectWithValue(errorPayload(error));
    }
  },
);

export const crearDoctor = createAsyncThunk(
  "doctores/crear",
  async (datos, { rejectWithValue }) => {
    try {
      return await api.createDoctor(datos);
    } catch (error) {
      return rejectWithValue(errorPayload(error));
    }
  },
);

export const reemplazarAgendaDoctor = createAsyncThunk(
  "doctores/reemplazarAgenda",
  async ({ doctorId, horarios }, { rejectWithValue }) => {
    try {
      return await api.replaceSchedule(doctorId, horarios);
    } catch (error) {
      return rejectWithValue(errorPayload(error));
    }
  },
);

const initialState = {
  data: [],
  loading: false,
  error: null,
  selected: null,
  lastSchedule: null,
};

const doctoresSlice = createSlice({
  name: "doctores",
  initialState,
  reducers: {
    limpiarDoctorSeleccionado: (state) => {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(listarDoctores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(listarDoctores.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(listarDoctores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      })

      .addCase(buscarDoctores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(buscarDoctores.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(buscarDoctores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      })

      .addCase(obtenerDoctorPorId.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selected = null;
      })
      .addCase(obtenerDoctorPorId.fulfilled, (state, action) => {
        state.loading = false;
        state.selected = action.payload;
      })
      .addCase(obtenerDoctorPorId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      })

      .addCase(crearDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(crearDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(crearDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      })

      .addCase(reemplazarAgendaDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reemplazarAgendaDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.lastSchedule = action.payload;
      })
      .addCase(reemplazarAgendaDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error;
      });
  },
});

export const { limpiarDoctorSeleccionado } = doctoresSlice.actions;

export const selectDoctores = (state) => state.doctores.data;
export const selectDoctoresLoading = (state) => state.doctores.loading;
export const selectDoctoresError = (state) => state.doctores.error;
export const selectDoctorSeleccionado = (state) => state.doctores.selected;

export default doctoresSlice.reducer;
