import assert from "node:assert/strict";
import { addDays, today } from "../src/lib/domain.js";

const base = process.env.API_URL || "http://localhost:5173/api";
const password = process.env.DEMO_PASSWORD;
if (!password)
  throw new Error("Ejecutar primero npm run setup y cargar los datos demo.");
const created = [];
async function request(path, { method = "GET", body, token } = {}) {
  const response = await fetch(base + path, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    data: await response.json().catch(() => null),
  };
}
async function login(email) {
  const result = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(result.status, 200, "Ingreso de " + email);
  return result.data;
}
const patient = await login("paciente@turnera.local");
const doctor = await login("medico@turnera.local");
const admin = await login("admin@turnera.local");
const doctors = await request("/doctores");
assert.equal(doctors.status, 200);
const professional = doctors.data.find(
  (item) => item.matriculaNacional === "DEMO-1001",
);
assert.ok(professional, "Ejecutar primero la carga demo");
const date = addDays(today(), 20);
const slotsPath =
  "/turnos/disponibles?doctorId=" + professional.id + "&fecha=" + date;
const slots = await request(slotsPath);
assert.equal(slots.status, 200);
assert.ok(slots.data.length, "Se necesita disponibilidad de demostración");
const slot = slots.data[0];
const reservation = {
  doctor: { id: professional.id },
  fechaHoraInicio: slot.fechaHoraInicio,
};
try {
  assert.equal((await request("/turnos")).status, 401, "Listado exige sesión");
  assert.equal(
    (
      await request("/turnos/reservar", {
        method: "POST",
        token: doctor.token,
        body: reservation,
      })
    ).status,
    403,
    "Médico no reserva como paciente",
  );
  assert.equal(
    (
      await request("/admin/especialidades", {
        method: "POST",
        token: patient.token,
        body: { nombre: "Verificación de acceso" },
      })
    ).status,
    403,
    "Paciente no administra",
  );
  const attempts = await Promise.all(
    [1, 2].map(() =>
      request("/turnos/reservar", {
        method: "POST",
        token: patient.token,
        body: reservation,
      }),
    ),
  );
  for (const result of attempts)
    if (result.status === 201) created.push(result.data.id);
  assert.deepEqual(
    attempts.map((item) => item.status).sort(),
    [201, 409],
    "Una sola reserva gana el mismo horario",
  );
  const turn = attempts.find((item) => item.status === 201).data;
  const personal = await request("/turnos?size=100", { token: patient.token });
  assert.equal(personal.status, 200);
  assert.ok(
    personal.data.content.every((item) => item.paciente.id === patient.id),
    "Listado limitado al paciente autenticado",
  );
  const agenda = await request("/turnos?size=100", { token: doctor.token });
  assert.equal(agenda.status, 200);
  assert.ok(
    agenda.data.content.every((item) => item.doctor.id === professional.id),
    "Agenda limitada al profesional",
  );
  const confirm = await request("/turnos/" + turn.id + "/estado", {
    method: "PATCH",
    token: doctor.token,
    body: { estadoDestino: "CONFIRMADO" },
  });
  assert.equal(confirm.status, 200);
  assert.equal(confirm.data.estado, "CONFIRMADO");
  const forbidden = await request("/turnos/" + turn.id + "/estado", {
    method: "PATCH",
    token: patient.token,
    body: { estadoDestino: "ATENDIDO" },
  });
  assert.equal(forbidden.status, 403);
  const cancel = await request("/turnos/" + turn.id + "/estado", {
    method: "PATCH",
    token: patient.token,
    body: {
      estadoDestino: "CANCELADO_PACIENTE",
      motivo: "Verificación integrada de demostración",
    },
  });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.data.estado, "CANCELADO_PACIENTE");
  assert.ok(
    (await request(slotsPath)).data.some(
      (item) => item.fechaHoraInicio === slot.fechaHoraInicio,
    ),
    "La cancelación libera el horario",
  );
  const terminal = await request("/turnos/" + turn.id + "/estado", {
    method: "PATCH",
    token: admin.token,
    body: { estadoDestino: "CONFIRMADO" },
  });
  assert.equal(terminal.status, 409, "No se reactiva un estado terminal");
  console.log(
    "Integración OK: login de 3 roles, catálogos, permisos 401/403, concurrencia 201/409, alcance de listados, confirmación, cancelación, liberación y estado terminal.",
  );
} finally {
  for (const id of created) {
    await request("/turnos/" + id + "/estado", {
      method: "PATCH",
      token: admin.token,
      body: {
        estadoDestino: "CANCELADO_PACIENTE",
        motivo: "Finalización de verificación local",
      },
    });
  }
}
