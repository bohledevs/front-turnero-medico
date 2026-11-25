
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api.js";

// Estado inicial del carrito.
const initialState = {
  carrito: null,
  status: "idle",
  error: null,
  mutationStatus: "idle",
  mutationError: null,
  requestId: null,
  mutationRequestId: null,
};

// Convertir errores de la API en datos serializables de Redux.
function errorPayload(error) {
  return {
    message: error?.message || "No se pudo completar la operación.",
    status: error?.status || 0,
  };
}

// GET /api/carrito
export const cargarCarrito = createAsyncThunk(
  "carrito/cargar",
  async (_, { rejectWithValue, signal }) => {
    try {
      const carritos = await api.carritos(signal);

      if (!Array.isArray(carritos)) {
        throw new Error("La respuesta del carrito no es válida.");
      }

      // El backend devuelve solo el carrito del paciente.
      return carritos[0] ?? null;
    } catch (error) {
      if (signal.aborted) throw error;
      return rejectWithValue(errorPayload(error));
    }
  },
);

// POST /api/carrito/items
export const agregarItemCarrito = createAsyncThunk(
  "carrito/agregar",
  async (body, { rejectWithValue }) => {
    try {
      return await api.agregarItemCarrito(body);
    } catch (error) {
      return rejectWithValue(errorPayload(error));
    }
  },
);

// DELETE /api/carrito/items/{itemId}
export const quitarItemCarrito = createAsyncThunk(
  "carrito/quitar",
  async (itemId, { rejectWithValue }) => {
    try {
      return await api.quitarItemCarrito(itemId);
    } catch (error) {
      return rejectWithValue(errorPayload(error));
    }
  },
);

const carritoSlice = createSlice({
  name: "carrito",
  initialState,

  reducers: {
    limpiarCarrito: () => ({ ...initialState }),
  },

  extraReducers: (builder) => {
    builder
      // Consultar carrito.
      .addCase(cargarCarrito.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.carrito = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(cargarCarrito.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;

        state.status = "succeeded";
        state.carrito = action.payload;
        state.requestId = null;
      })
      .addCase(cargarCarrito.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;

        state.requestId = null;
        if (action.meta.aborted) return;

        state.status = "failed";
        state.error = action.payload?.message || action.error.message;
      })

      // Agregar un turno.
      .addCase(agregarItemCarrito.pending, (state, action) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
        state.mutationRequestId = action.meta.requestId;
      })
      .addCase(agregarItemCarrito.fulfilled, (state, action) => {
        if (state.mutationRequestId !== action.meta.requestId) return;

        state.carrito = action.payload;
        state.status = "succeeded";
        state.mutationStatus = "succeeded";
        state.mutationRequestId = null;
      })
      .addCase(agregarItemCarrito.rejected, (state, action) => {
        if (state.mutationRequestId !== action.meta.requestId) return;

        state.mutationStatus = "failed";
        state.mutationError = action.payload?.message || action.error.message;
        state.mutationRequestId = null;
      })

      // Quitar un turno.
      .addCase(quitarItemCarrito.pending, (state, action) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
        state.mutationRequestId = action.meta.requestId;
      })
      .addCase(quitarItemCarrito.fulfilled, (state, action) => {
        if (state.mutationRequestId !== action.meta.requestId) return;

        state.carrito = action.payload;
        state.status = "succeeded";
        state.mutationStatus = "succeeded";
        state.mutationRequestId = null;
      })
      .addCase(quitarItemCarrito.rejected, (state, action) => {
        if (state.mutationRequestId !== action.meta.requestId) return;

        state.mutationStatus = "failed";
        state.mutationError = action.payload?.message || action.error.message;
        state.mutationRequestId = null;
      });
  },
});

export const { limpiarCarrito } = carritoSlice.actions;

// Selectores para los componentes React.
export const selectCarrito = (state) => state.carrito.carrito;

export const selectCantidadCarrito = (state) =>
  state.carrito.carrito?.items?.length ?? 0;

export const selectEstadoCarrito = (state) => state.carrito.status;

// Evitar agregar dos veces el mismo horario.
export function turnoEstaEnCarrito(carrito, doctorId, fechaHoraInicio) {
  return Boolean(
    carrito?.items?.some(
      (item) =>
        Number(item.doctor.id) === Number(doctorId) &&
        item.fechaHoraInicio === fechaHoraInicio,
    ),
  );
}

export default carritoSlice.reducer;
