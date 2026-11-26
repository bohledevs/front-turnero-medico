import axios from "axios";
import { resetStaticState, staticRequest } from "./staticApi.js";

// Solo el modo demo guarda su sesión simulada en el navegador. Con el backend real el JWT viaja en
// una cookie HttpOnly que el JavaScript no puede leer (ver docs/persistencia-sesion.md).
const SESSION_KEY = "turnera.session";
const DATA_MODE_KEY = "turnera.dataMode";
const DEFAULT_DATA_MODE =
  import.meta.env?.VITE_DATA_MODE === "static" ||
  import.meta.env?.MODE === "static"
    ? "static"
    : "api";

// Fuente de datos elegida desde el pie de página: "static" (demo local) o "api" (backend real).
export function getDataMode() {
  try {
    const mode = localStorage.getItem(DATA_MODE_KEY);
    if (mode === "static" || mode === "api") return mode;
  } catch {
    // Sin almacenamiento disponible se usa el modo configurado al compilar.
  }
  return DEFAULT_DATA_MODE;
}
export function setDataMode(mode) {
  if (mode !== "static" && mode !== "api") return;
  const anterior = getDataMode();
  try {
    localStorage.setItem(DATA_MODE_KEY, mode);
  } catch {
    // Si no se puede persistir, el cambio no sobrevive a una recarga.
  }
  // Una sesión de una fuente no sirve en la otra. Si se deja el backend real, se le pide que
  // borre la cookie de sesión.
  if (anterior === "api" && mode !== "api") {
    axiosClient
      .post("/auth/logout", null, { notifyExpired: false })
      .catch(() => {});
  }
  saveSession(null);
  window.dispatchEvent(new Event("turnera:logout"));
}
export function resetDemo() {
  resetStaticState();
}

// Sesión simulada del modo demo: { token, expiresAt }.
export function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return session?.token && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}
export function saveSession(session) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}
export class ApiError extends Error {
  constructor(message, status = 0, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors || {};
  }
}


/**
 * Cliente HTTP centralizado.
 * Todas las solicitudes reales al backend pasan por Axios.
 */
export const axiosClient = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
  },
  // La sesión viaja sola en la cookie HttpOnly "turnera_sesion" (mismo origen gracias al proxy /api).
  // Para los pedidos que modifican datos, Axios copia la cookie XSRF-TOKEN en el header X-XSRF-TOKEN:
  // otro sitio no puede leer esa cookie, así que no puede falsificar el pedido (CSRF).
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // notifyExpired: false para pedidos donde un 401 no significa que la sesión venció (login, /auth/me).
    const notifyExpired =
      error.config?.notifyExpired ?? error.config?.authenticated !== false;
    if (error.response?.status === 401 && notifyExpired) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("turnera:expired"));
      }
    }

    return Promise.reject(error);
  },
);


export function query(values = {}) {
  return new URLSearchParams(
    Object.entries(values).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  ).toString();
}

export async function request(
  path,
  {
    method = "GET",
    body,
    signal,
    authenticated = true,
    notifyExpired = authenticated,
  } = {},
) {
  if (getDataMode() === "static") {
    const session = authenticated ? getSession() : null;
    try {
      return await staticRequest(path, {
        method,
        body,
        signal,
        session,
      });
    } catch (error) {
      if (error.status === 401 && notifyExpired) {
        saveSession(null);
        window.dispatchEvent(new Event("turnera:expired"));
      }

      throw error;
    }
  }

  // Modo API: realizar la petición mediante Axios.
  try {
    const response = await axiosClient.request({
      url: path,
      method,
      data: body,
      signal,
      authenticated,
      notifyExpired,
    });

    return response.data;
  } catch (error) {
    if (axios.isCancel(error) || error.name === "AbortError") {
      throw new DOMException(
        "Solicitud cancelada",
        "AbortError",
      );
    }

    // Error de conexión.
    if (!error.response) {
      throw new ApiError(
        "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.",
      );
    }

    const status = error.response.status;
    const data = error.response.data;

    throw new ApiError(
      data?.message ||
        (status >= 500
          ? "El servicio no está disponible en este momento. Volvé a intentar."
          : "No se pudo completar la operación."),
      status,
      data?.fieldErrors,
    );
  }
}

export const api = {
  login: async (body) => {
    const data = await request("/auth/login", {
      method: "POST",
      body,
      authenticated: false,
    });
    // eslint-disable-next-line no-unused-vars
    const { token, tokenType, ...usuario } = data;
    // El token real queda en la cookie HttpOnly; solo el modo demo lo guarda para simularla.
    if (getDataMode() === "static") {
      saveSession({ token, expiresAt: Date.now() + data.expiresIn * 1000 });
    }
    return usuario;
  },
  register: (body) =>
    request("/auth/register", { method: "POST", body, authenticated: false }),
  // Sesión actual sin el token; un 401 acá significa "no hay sesión", no "venció".
  me: (signal) => request("/auth/me", { signal, notifyExpired: false }),
  logout: async () => {
    try {
      await request("/auth/logout", { method: "POST", notifyExpired: false });
    } finally {
      saveSession(null);
    }
  },
  doctors: (filters, signal) =>
    request("/doctores?" + query(filters), { signal, authenticated: false }),
  
  doctorById: (id, signal) =>
  request(`/doctores/${id}`, {signal,authenticated: false,}),

  specialties: (signal) =>
    request("/especialidades", { signal, authenticated: false }),

  
  specialtyById: (id, signal) =>
  request(`/especialidades/${id}`, {signal,authenticated: false,}),

  
  availability: (filters, signal) =>
    request("/turnos/disponibles?" + query(filters), {
      signal,
      authenticated: false,
    }),
  appointments: (filters, signal) =>
    request("/turnos?" + query(filters), { signal }),
  
  appointmentById: (id, signal) =>
    request(`/turnos/${id}`, {signal,}),

  reserve: (body) => request("/turnos/reservar", { method: "POST", body }),
  changeStatus: (id, body) =>
    request("/turnos/" + id + "/estado", { method: "PATCH", body }),
  extraAppointment: (body) =>
    request("/turnos/sobreturno", { method: "POST", body }),
  createSpecialty: (body) =>
    request("/admin/especialidades", { method: "POST", body }),
  createDoctor: (body) => request("/admin/doctores", { method: "POST", body }),
  replaceSchedule: (id, body) =>
    request("/admin/doctores/" + id + "/horarios", { method: "PUT", body }),
};
