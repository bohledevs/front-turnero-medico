const SESSION_KEY = "turnera.session";
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
export function query(values = {}) {
  return new URLSearchParams(
    Object.entries(values).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  ).toString();
}
export async function request(
  path,
  { method = "GET", body, signal, authenticated = true } = {},
) {
  const session = authenticated ? getSession() : null;
  let response;
  try {
    response = await fetch("/api" + path, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Authorization: "Bearer " + session.token } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      saveSession(null);
      window.dispatchEvent(new Event("turnera:expired"));
    }
    throw new ApiError(
      data?.message ||
        (response.status >= 500
          ? "El servicio no está disponible en este momento. Volvé a intentar."
          : "No se pudo completar la operación."),
      response.status,
      data?.fieldErrors,
    );
  }
  return data;
}
export const api = {
  login: (body) =>
    request("/auth/login", { method: "POST", body, authenticated: false }),
  register: (body) =>
    request("/auth/register", { method: "POST", body, authenticated: false }),
  doctors: (filters, signal) =>
    request("/doctores?" + query(filters), { signal, authenticated: false }),
  specialties: (signal) =>
    request("/especialidades", { signal, authenticated: false }),
  availability: (filters, signal) =>
    request("/turnos/disponibles?" + query(filters), {
      signal,
      authenticated: false,
    }),
  appointments: (filters, signal) =>
    request("/turnos?" + query(filters), { signal }),
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
