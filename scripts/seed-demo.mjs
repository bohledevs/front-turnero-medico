const base = process.env.API_URL || "http://localhost:8081/api";
const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error("Falta DEMO_PASSWORD. Ejecutar npm run setup.");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function call(path, { method = "GET", body, token } = {}) {
  const response = await fetch(base + path, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      method +
        " " +
        path +
        ": " +
        response.status +
        " " +
        (data?.message || "Error de API"),
    );
  return data;
}
let ready = false;
for (let attempt = 0; attempt < 90; attempt++) {
  try {
    await call("/especialidades");
    ready = true;
    break;
  } catch {
    if (attempt % 10 === 0) console.log("Esperando al backend…");
    await sleep(2000);
  }
}
if (!ready) throw new Error("El backend no respondió en tres minutos.");
const admin = await call("/auth/login", {
  method: "POST",
  body: { email: "admin@turnera.local", password },
});
const specialties = await call("/especialidades");
const specialtyDefs = [
  ["Clínica médica", "Atención integral para acompañar tu salud."],
  ["Cardiología", "Cuidado y prevención de la salud cardiovascular."],
  ["Dermatología", "Atención de la piel y sus cuidados."],
];
for (const [nombre, descripcion] of specialtyDefs) {
  if (!specialties.some((item) => item.nombre === nombre))
    specialties.push(
      await call("/admin/especialidades", {
        method: "POST",
        token: admin.token,
        body: { nombre, descripcion },
      }),
    );
}
const doctors = await call("/doctores");
const profiles = [
  {
    nombre: "Lucía",
    apellido: "Méndez",
    dni: "30100101",
    email: "medico@turnera.local",
    matriculaNacional: "DEMO-1001",
    especialidad: "Clínica médica",
  },
  {
    nombre: "Tomás",
    apellido: "Rivera",
    dni: "30100102",
    email: "cardiologia@turnera.local",
    matriculaNacional: "DEMO-1002",
    especialidad: "Cardiología",
  },
  {
    nombre: "Valentina",
    apellido: "Costa",
    dni: "30100103",
    email: "dermatologia@turnera.local",
    matriculaNacional: "DEMO-1003",
    especialidad: "Dermatología",
  },
];
for (const profile of profiles) {
  if (
    doctors.some((item) => item.matriculaNacional === profile.matriculaNacional)
  )
    continue;
  const { especialidad, ...person } = profile;
  const doctor = await call("/admin/doctores", {
    method: "POST",
    token: admin.token,
    body: {
      ...person,
      password,
      especialidadId: specialties.find((item) => item.nombre === especialidad)
        .id,
    },
  });
  doctors.push(doctor);
  await call("/admin/doctores/" + doctor.id + "/horarios", {
    method: "PUT",
    token: admin.token,
    body: [
      "LUNES",
      "MARTES",
      "MIERCOLES",
      "JUEVES",
      "VIERNES",
      "SABADO",
      "DOMINGO",
    ].map((diaSemana) => ({
      diaSemana,
      horaInicio: "09:00:00",
      horaFin: "17:00:00",
      duracionTurnoMinutos: 30,
    })),
  });
}
let patient;
try {
  patient = await call("/auth/login", {
    method: "POST",
    body: { email: "paciente@turnera.local", password },
  });
} catch {
  await call("/auth/register", {
    method: "POST",
    body: {
      nombre: "Sofía",
      apellido: "García",
      dni: "40100101",
      fechaNacimiento: "1995-04-18",
      email: "paciente@turnera.local",
      password,
    },
  });
  patient = await call("/auth/login", {
    method: "POST",
    body: { email: "paciente@turnera.local", password },
  });
}
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const existing = await call(
  "/turnos?size=100&fechaDesde=" + day + "T00:00:00",
  { token: patient.token },
);
for (let i = 0; i < profiles.length; i++) {
  const doctor = doctors.find(
    (item) => item.matriculaNacional === profiles[i].matriculaNacional,
  );
  if (existing.content.some((item) => item.doctor.id === doctor.id)) continue;
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + i + 1);
  const slots = await call(
    "/turnos/disponibles?doctorId=" +
      doctor.id +
      "&fecha=" +
      date.toISOString().slice(0, 10),
  );
  if (!slots.length) continue;
  const chosen = slots[Math.min(i + 2, slots.length - 1)];
  const turn = await call("/turnos/reservar", {
    method: "POST",
    token: patient.token,
    body: {
      doctor: { id: doctor.id },
      fechaHoraInicio: chosen.fechaHoraInicio,
    },
  });
  if (i === 0)
    await call("/turnos/" + turn.id + "/estado", {
      method: "PATCH",
      token: admin.token,
      body: { estadoDestino: "CONFIRMADO", motivo: "Turno de demostración" },
    });
}
console.log(
  "Datos ficticios listos: 3 especialidades, 3 profesionales, 1 paciente y turnos próximos. Cuentas en demo-access.md.",
);
