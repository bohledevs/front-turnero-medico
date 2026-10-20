import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { staticRequest } from "../src/services/staticApi.js";

const dataDirectory = new URL("../public/data/", import.meta.url);

globalThis.fetch = async (path, { signal } = {}) => {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const file = await readFile(new URL(path.replace("/data/", ""), dataDirectory));
  return new Response(file, {
    headers: { "Content-Type": "application/json" },
  });
};

function nextWeekday(weekday) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  const date = new Date(
    `${parts.year}-${parts.month}-${parts.day}T12:00:00Z`,
  );
  do {
    date.setUTCDate(date.getUTCDate() + 1);
  } while (date.getUTCDay() !== weekday);
  return date.toISOString().slice(0, 10);
}

test("fixtures estáticos conservan contratos y simulan recorridos de los tres roles", async () => {
  await assert.rejects(
    staticRequest("/auth/login", {
      method: "POST",
      body: { email: "paciente@demo.example.test", password: "incorrecta" },
    }),
    (error) => error.status === 401,
  );

  const patient = await staticRequest("/auth/login", {
    method: "POST",
    body: {
      email: "paciente@demo.example.test",
      password: "DemoPaciente123",
    },
  });
  assert.deepEqual(Object.keys(patient), [
    "id",
    "nombre",
    "apellido",
    "email",
    "rol",
    "token",
    "tokenType",
    "expiresIn",
  ]);
  const patientSession = patient;

  const doctors = await staticRequest("/doctores");
  const specialties = await staticRequest("/especialidades");
  assert.equal(doctors.length, 3);
  assert.equal(specialties[0].nombre, "Clínica médica");
  assert.deepEqual(
    await staticRequest("/doctores?nombre=sin-resultados"),
    [],
  );

  const date = nextWeekday(4);
  const availability = await staticRequest(
    `/turnos/disponibles?doctorId=10&fecha=${date}`,
  );
  assert.ok(availability.length > 0);
  assert.deepEqual(Object.keys(availability[0]), [
    "id",
    "doctor",
    "fechaHoraInicio",
    "fechaHoraFin",
  ]);

  const page = await staticRequest("/turnos?page=0&size=2", {
    session: patientSession,
  });
  assert.equal(page.totalElements, 5);
  assert.equal(page.totalPages, 3);
  assert.equal(page.content.length, 2);
  assert.deepEqual(Object.keys(page).sort(), [
    "content",
    "empty",
    "first",
    "last",
    "number",
    "numberOfElements",
    "pageable",
    "size",
    "sort",
    "totalElements",
    "totalPages",
  ]);
  const empty = await staticRequest(
    "/turnos?fechaDesde=2099-01-01T00%3A00%3A00&size=8",
    { session: patientSession },
  );
  assert.equal(empty.empty, true);
  assert.equal(empty.totalElements, 0);

  const appointment = await staticRequest("/turnos/reservar", {
    method: "POST",
    body: {
      doctor: { id: 10 },
      fechaHoraInicio: `${date}T09:30:00`,
    },
    session: patientSession,
  });
  assert.deepEqual(Object.keys(appointment), [
    "id",
    "doctor",
    "paciente",
    "fechaHoraInicio",
    "fechaHoraFin",
    "estado",
    "esSobreturned",
    "justificacionSobreturned",
  ]);
  assert.equal(appointment.estado, "RESERVADO");
  const updatedPage = await staticRequest("/turnos?size=8", {
    session: patientSession,
  });
  assert.equal(updatedPage.totalElements, 6);

  const doctorSession = await staticRequest("/auth/login", {
    method: "POST",
    body: { email: "medico@demo.example.test", password: "DemoMedico123" },
  });
  const doctorPage = await staticRequest("/turnos?size=8", {
    session: doctorSession,
  });
  assert.ok(doctorPage.content.every(({ doctor }) => doctor.id === 10));

  const adminSession = await staticRequest("/auth/login", {
    method: "POST",
    body: { email: "admin@demo.example.test", password: "DemoAdmin123" },
  });
  const specialty = await staticRequest("/admin/especialidades", {
    method: "POST",
    body: { nombre: "Neurología", descripcion: null },
    session: adminSession,
  });
  const newDoctor = await staticRequest("/admin/doctores", {
    method: "POST",
    body: {
      nombre: "Noa",
      apellido: "Demo",
      matriculaNacional: "MN-99001",
      especialidadId: specialty.id,
    },
    session: adminSession,
  });
  assert.equal(newDoctor.especialidadNombre, "Neurología");
  const schedules = await staticRequest(`/admin/doctores/${newDoctor.id}/horarios`, {
    method: "PUT",
    body: [
      {
        diaSemana: "LUNES",
        horaInicio: "09:00:00",
        horaFin: "12:00:00",
        duracionTurnoMinutos: 30,
      },
    ],
    session: adminSession,
  });
  assert.deepEqual(schedules[0], {
    id: 1,
    diaSemana: "LUNES",
    horaInicio: "09:00:00",
    horaFin: "12:00:00",
    duracionTurnoMinutos: 30,
  });
});
