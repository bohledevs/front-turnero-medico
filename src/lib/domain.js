export const TIME_ZONE = "America/Argentina/Buenos_Aires";
export const ROLES = {
  PACIENTE: "Paciente",
  MEDICO: "Profesional",
  ADMIN: "Administración",
};
export const STATUS = {
  RESERVADO: "Reservado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  AUSENTE: "Ausente",
  CANCELADO_PACIENTE: "Cancelado por paciente",
  CANCELADO_MEDICO: "Cancelado por profesional",
};
export const DAYS = [
  ["LUNES", "Lunes"],
  ["MARTES", "Martes"],
  ["MIERCOLES", "Miércoles"],
  ["JUEVES", "Jueves"],
  ["VIERNES", "Viernes"],
  ["SABADO", "Sábado"],
  ["DOMINGO", "Domingo"],
];
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function addDays(value, amount) {
  const date = new Date(value + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
// LocalDateTime llega sin zona: se interpreta siempre como hora de Buenos Aires.
export function asDate(value) {
  return new Date(
    value.length === 10 ? value + "T12:00:00-03:00" : value + "-03:00",
  );
}
export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    ...options,
  }).format(asDate(value));
}
export function formatTime(value) {
  return value.slice(11, 16);
}
export function isFuture(value) {
  return asDate(value).getTime() > Date.now();
}
export function fullName(person) {
  return [person?.nombre, person?.apellido].filter(Boolean).join(" ");
}
export function initials(person) {
  return [person?.nombre?.[0], person?.apellido?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();
}
export function allowedTransitions(status, role) {
  if (!["RESERVADO", "CONFIRMADO"].includes(status)) return [];
  if (role === "PACIENTE") return ["CANCELADO_PACIENTE"];
  const next =
    status === "RESERVADO" ? ["CONFIRMADO"] : ["ATENDIDO", "AUSENTE"];
  return role === "ADMIN"
    ? [...next, "CANCELADO_MEDICO", "CANCELADO_PACIENTE"]
    : role === "MEDICO"
      ? [...next, "CANCELADO_MEDICO"]
      : [];
}
export function needsReason(status) {
  return status === "AUSENTE" || status.startsWith("CANCELADO");
}
export function passwordError(value) {
  if (value.length < 8) return "Usá al menos 8 caracteres.";
  if (new TextEncoder().encode(value).length > 72)
    return "La contraseña supera el máximo de 72 bytes. Usá una más corta.";
  return "";
}
export function validateSchedule(rows) {
  const minutes = (value) =>
    Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  for (const row of rows) {
    const duration = Number(row.duracionTurnoMinutos);
    const length = minutes(row.horaFin) - minutes(row.horaInicio);
    if (!row.diaSemana || !row.horaInicio || !row.horaFin || length <= 0)
      return "Cada franja debe terminar después de su inicio.";
    if (!Number.isInteger(duration) || duration <= 0 || length % duration !== 0)
      return "La duración del turno debe dividir exactamente cada franja.";
  }
  for (const [day] of DAYS) {
    const ordered = rows
      .filter((row) => row.diaSemana === day)
      .toSorted((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    if (
      ordered.some((row, i) => i > 0 && row.horaInicio < ordered[i - 1].horaFin)
    )
      return "Las franjas de un mismo día no pueden superponerse.";
  }
  return "";
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(value + "T12:00:00Z");
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function nowLocal() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return (
    parts.year +
    "-" +
    parts.month +
    "-" +
    parts.day +
    "T" +
    parts.hour +
    ":" +
    parts.minute +
    ":" +
    parts.second
  );
}
