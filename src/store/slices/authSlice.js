import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api.js";

// Slice de autenticación: quién está logueado y en qué estado está la sesión.
// El token NO se guarda acá ni en el navegador: viaja en una cookie HttpOnly que pone el backend.
// Al recargar la página (F5) el store arranca vacío y restaurarSesion lo vuelve a llenar con GET /auth/me.

// Solo los datos que la interfaz necesita; nunca el token.
function aUsuario(datos) {
  return {
    id: datos.id,
    nombre: datos.nombre,
    apellido: datos.apellido,
    email: datos.email,
    rol: datos.rol,
    expiresAt: Date.now() + datos.expiresIn * 1000,
  };
}

// Los errores de la API (ApiError) no se pueden guardar tal cual en Redux: se pasan a un objeto plano.
function aError(error) {
  return {
    message: error.message,
    status: error.status ?? 0,
    fieldErrors: error.fieldErrors ?? {},
  };
}

// dispatch(iniciarSesion({ email, password })).unwrap()
export const iniciarSesion = createAsyncThunk(
  "auth/iniciarSesion",
  async (credenciales, { rejectWithValue }) => {
    try {
      return aUsuario(await api.login(credenciales));
    } catch (error) {
      return rejectWithValue(aError(error));
    }
  },
);

// Recupera la sesión desde la cookie. Si no hay sesión (401) o el backend no responde, queda anónima.
export const restaurarSesion = createAsyncThunk(
  "auth/restaurarSesion",
  async (_, { signal }) => {
    try {
      return aUsuario(await api.me(signal));
    } catch {
      return null;
    }
  },
);

// Pide al backend que borre la cookie. La sesión local se cierra aunque ese pedido falle.
export const cerrarSesion = createAsyncThunk("auth/cerrarSesion", async () => {
  try {
    await api.logout();
  } catch {
    // sin conexión la cookie vence sola con el JWT
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    usuario: null, // { id, nombre, apellido, email, rol, expiresAt }
    estado: "verificando", // "verificando" | "autenticado" | "anonimo"
    vencida: false, // true si la sesión se cerró por vencimiento (para avisarle al usuario)
  },
  reducers: {
    // dispatch(sesionVencida()) cuando la API responde 401 o se cumple el vencimiento del JWT
    sesionVencida: (state) => {
      state.usuario = null;
      state.estado = "anonimo";
      state.vencida = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(iniciarSesion.fulfilled, (state, action) => {
        state.usuario = action.payload;
        state.estado = "autenticado";
        state.vencida = false;
      })
      .addCase(restaurarSesion.fulfilled, (state, action) => {
        state.usuario = action.payload;
        state.estado = action.payload ? "autenticado" : "anonimo";
      })
      .addCase(restaurarSesion.rejected, (state) => {
        state.estado = state.usuario ? "autenticado" : "anonimo";
      })
      .addCase(cerrarSesion.pending, (state) => {
        state.usuario = null;
        state.estado = "anonimo";
        state.vencida = false;
      });
  },
});

export const { sesionVencida } = authSlice.actions;

export const selectUsuario = (store) => store.auth.usuario;
export const selectEstadoSesion = (store) => store.auth.estado;
export const selectSesionVencida = (store) => store.auth.vencida;

export default authSlice.reducer;
