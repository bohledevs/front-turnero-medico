const DATA_FILES = {
  specialties: "/data/especialidades.json",
  doctors: "/data/doctores.json",
  availability: "/data/disponibilidad.json",
  appointments: "/data/turnos.json",
  patients: "/data/pacientes.json",
  accounts: "/data/cuentas-demo.json",
};

let statePromise;

export class StaticApiError extends Error {
  constructor(message, status = 0, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function fail(message, status, fieldErrors) {
  throw new StaticApiError(message, status, fieldErrors);
}

function checkAbort(signal) {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

async function readJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new StaticApiError(
      `No se pudo cargar el fixture ${path}.`,
      response.status,
    );
  }
  return response.json();
}

function shiftDate(value, days) {
  const [date, time] = value.split("T");
  const shifted = new Date(`${date}T12:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return `${shifted.toISOString().slice(0, 10)}T${time}`;
}

function dayOfWeek(value) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function argentinaDateTime() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function dayOffsetFromFixture() {
  const [year, month, day] = argentinaDateTime().slice(0, 10).split("-");
  const current = Date.UTC(Number(year), Number(month) - 1, Number(day));
  const fixture = Date.UTC(2026, 9, 19);
  return Math.round((current - fixture) / 86400000);
}

async function loadState() {
  if (!statePromise) {
    statePromise = Promise.all(
      Object.entries(DATA_FILES).map(async ([key, path]) => [
        key,
        await readJson(path),
      ]),
    )
      .then((entries) => {
        const data = Object.fromEntries(entries);
        const offset = dayOffsetFromFixture();
        data.appointments.content = data.appointments.content.map(
          (appointment) => ({
            ...appointment,
            fechaHoraInicio: shiftDate(appointment.fechaHoraInicio, offset),
            fechaHoraFin: shiftDate(appointment.fechaHoraFin, offset),
          }),
        );
        data.schedules = {};
        data.nextIds = {
          doctor: Math.max(...data.doctors.map(({ id }) => id)) + 1,
          specialty: Math.max(...data.specialties.map(({ id }) => id)) + 1,
          appointment:
            Math.max(...data.appointments.content.map(({ id }) => id)) + 1,
          patient: Math.max(...data.patients.map(({ id }) => id)) + 1,
          schedule: 1,
        };
        return data;
      })
      .catch((error) => {
        statePromise = null;
        throw error;
      });
  }
  const data = await statePromise;
  return data;
}

function profile(data, session) {
  if (!session?.token) fail("Debés ingresar para continuar.", 401);
  const account = data.accounts.find(
    ({ response }) => response.token === session.token,
  );
  if (!account) fail("La sesión está vencida o no es válida.", 401);
  return account.response;
}

function requireRole(user, ...roles) {
  if (!roles.includes(user.rol)) fail("No tenés permiso para esta operación.", 403);
}

function pageResponse(content, page, size, sortKey) {
  const totalElements = content.length;
  const totalPages = Math.ceil(totalElements / size);
  const sort = {
    empty: !sortKey,
    sorted: Boolean(sortKey),
    unsorted: !sortKey,
  };
  const pageContent = content.slice(page * size, (page + 1) * size);
  return {
    content: pageContent,
    pageable: {
      pageNumber: page,
      pageSize: size,
      sort,
      offset: page * size,
      paged: true,
      unpaged: false,
    },
    last: page + 1 >= totalPages,
    totalPages,
    totalElements,
    size,
    number: page,
    sort,
    first: page === 0,
    numberOfElements: pageContent.length,
    empty: pageContent.length === 0,
  };
}

function matchesAppointment(appointment, params) {
  const start = appointment.fechaHoraInicio;
  return (
    (!params.get("doctorId") ||
      appointment.doctor.id === Number(params.get("doctorId"))) &&
    (!params.get("pacienteId") ||
      appointment.paciente?.id === Number(params.get("pacienteId"))) &&
    (!params.get("estado") || appointment.estado === params.get("estado")) &&
    (!params.get("fechaDesde") || start >= params.get("fechaDesde")) &&
    (!params.get("fechaHasta") || start <= params.get("fechaHasta"))
  );
}

function validatePatient(values) {
  const fieldErrors = {};
  if (!/^\d{7,8}$/.test(values.dni || "")) {
    fieldErrors.dni = "El DNI debe tener 7 u 8 dígitos numéricos.";
  }
  for (const field of ["nombre", "apellido", "email", "password"]) {
    if (!values[field]?.trim()) fieldErrors[field] = "Este campo es obligatorio.";
  }
  if (values.password?.length < 8) {
    fieldErrors.password = "La contraseña debe tener al menos 8 caracteres.";
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    fieldErrors.email = "El email debe tener un formato válido.";
  }
  if (
    !values.fechaNacimiento ||
    values.fechaNacimiento >= argentinaDateTime().slice(0, 10)
  ) {
    fieldErrors.fechaNacimiento =
      "La fecha de nacimiento debe ser anterior a hoy.";
  }
  if (values.telefono && !/^\d{6,20}$/.test(values.telefono)) {
    fieldErrors.telefono = "El teléfono debe tener entre 6 y 20 dígitos.";
  }
  if (Object.keys(fieldErrors).length) {
    fail("Revisá los datos ingresados.", 400, fieldErrors);
  }
}

export async function staticRequest(
  path,
  { method = "GET", body, signal, session } = {},
) {
  checkAbort(signal);
  const data = await loadState();
  checkAbort(signal);
  const params = new URLSearchParams(path.split("?")[1] || "");
  const route = path.split("?")[0];

  if (route === "/auth/login" && method === "POST") {
    const account = data.accounts.find(
      ({ email, password }) =>
        email.toLowerCase() === (body.email || "").trim().toLowerCase() &&
        password === body.password,
    );
    if (!account) fail("Email o contraseña incorrectos.", 401);
    return { ...account.response };
  }
  if (route === "/auth/register" && method === "POST") {
    validatePatient(body);
    if (
      data.patients.some(
        ({ dni, email }) =>
          dni === body.dni ||
          email.toLowerCase() === body.email.trim().toLowerCase(),
      )
    ) {
      fail("El DNI o email ya se encuentra registrado.", 409);
    }
    const patient = {
      id: data.nextIds.patient++,
      dni: body.dni,
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email.trim(),
      telefono: body.telefono ?? null,
      rol: "PACIENTE",
      activo: true,
      fechaNacimiento: body.fechaNacimiento,
      obraSocial: body.obraSocial ?? null,
      numeroAfiliado: body.numeroAfiliado ?? null,
    };
    const response = {
      id: patient.id,
      nombre: patient.nombre,
      apellido: patient.apellido,
      email: patient.email,
      rol: patient.rol,
      token: `static-paciente-${patient.id}`,
      tokenType: "Bearer",
      expiresIn: 3600,
    };
    data.patients.push(patient);
    data.accounts.push({
      email: body.email.trim(),
      password: body.password,
      response,
    });
    return patient;
  }
  if (route === "/doctores" && method === "GET") {
    return data.doctors.filter(
      (doctor) =>
        (!params.get("especialidadId") ||
          doctor.especialidadId === Number(params.get("especialidadId"))) &&
        (!params.get("nombre") ||
          `${doctor.nombre} ${doctor.apellido}`
            .toLowerCase()
            .includes(params.get("nombre").toLowerCase())),
    );
  }
  if (route === "/especialidades" && method === "GET") {
    return data.specialties;
  }
  if (route === "/turnos/disponibles" && method === "GET") {
    const doctorId = Number(params.get("doctorId"));
    const date = params.get("fecha");
    if (!doctorId || !date) fail("Indicá profesional y fecha.", 400);
    const booked = data.appointments.content.filter(
      (appointment) =>
        appointment.doctor.id === doctorId &&
        appointment.fechaHoraInicio.startsWith(date) &&
        !["CANCELADO_PACIENTE", "CANCELADO_MEDICO"].includes(
          appointment.estado,
        ),
    );
    return data.availability
      .filter(
        (slot) =>
          slot.doctor.id === doctorId &&
          dayOfWeek(slot.fechaHoraInicio) === dayOfWeek(date),
      )
      .map((slot) => ({
        ...slot,
        fechaHoraInicio: `${date}${slot.fechaHoraInicio.slice(10)}`,
        fechaHoraFin: `${date}${slot.fechaHoraFin.slice(10)}`,
      }))
      .filter(
        (slot) =>
          !booked.some(
            (appointment) =>
              appointment.fechaHoraInicio < slot.fechaHoraFin &&
              appointment.fechaHoraFin > slot.fechaHoraInicio,
          ) &&
          slot.fechaHoraInicio > argentinaDateTime(),
      );
  }
  if (route === "/turnos" && method === "GET") {
    const user = profile(data, session);
    let appointments = data.appointments.content.filter((appointment) =>
      matchesAppointment(appointment, params),
    );
    if (user.rol === "PACIENTE") {
      appointments = appointments.filter(
        ({ paciente }) => paciente?.id === user.id,
      );
    } else if (user.rol === "MEDICO") {
      appointments = appointments.filter(
        ({ doctor }) => doctor.id === user.id,
      );
    }
    const sort = params.get("sort")?.split(",") || [];
    if (sort[0] === "fechaHoraInicio") {
      appointments.sort((a, b) =>
        sort[1] === "desc"
          ? b.fechaHoraInicio.localeCompare(a.fechaHoraInicio)
          : a.fechaHoraInicio.localeCompare(b.fechaHoraInicio),
      );
    }
    return pageResponse(
      appointments,
      Math.max(0, Number(params.get("page") || 0)),
      Math.max(1, Number(params.get("size") || 10)),
      sort[0],
    );
  }
  if (route === "/turnos/reservar" && method === "POST") {
    const user = profile(data, session);
    requireRole(user, "PACIENTE");
    const { doctor, fechaHoraInicio } = body;
    const slot = data.availability.find(
      (item) =>
        item.doctor.id === doctor?.id &&
        item.fechaHoraInicio.slice(10) === fechaHoraInicio?.slice(10),
    );
    if (!slot || !fechaHoraInicio) {
      fail("El horario seleccionado no está disponible.", 409);
    }
    const duration =
      new Date(`2000-01-01T${slot.fechaHoraFin.slice(11)}Z`) -
      new Date(`2000-01-01T${slot.fechaHoraInicio.slice(11)}Z`);
    const fechaHoraFin = new Date(
      new Date(`${fechaHoraInicio}Z`).getTime() + duration,
    )
      .toISOString()
      .slice(0, 19);
    const conflicts = data.appointments.content.some(
      (appointment) =>
        appointment.doctor.id === doctor.id &&
        appointment.fechaHoraInicio < fechaHoraFin &&
        appointment.fechaHoraFin > fechaHoraInicio &&
        !["CANCELADO_PACIENTE", "CANCELADO_MEDICO"].includes(
          appointment.estado,
        ),
    );
    if (conflicts) fail("El horario seleccionado ya no está disponible.", 409);
    if (fechaHoraInicio <= argentinaDateTime()) {
      fail("La fecha y hora del turno deben ser futuras.", 400);
    }
    const response = {
      id: data.nextIds.appointment++,
      doctor: { id: doctor.id },
      paciente: { id: user.id },
      fechaHoraInicio,
      fechaHoraFin,
      estado: "RESERVADO",
      esSobreturned: false,
      justificacionSobreturned: null,
    };
    data.appointments.content.push(response);
    return response;
  }
  const statusMatch = route.match(/^\/turnos\/(\d+)\/estado$/);
  if (statusMatch && method === "PATCH") {
    const user = profile(data, session);
    const appointment = data.appointments.content.find(
      ({ id }) => id === Number(statusMatch[1]),
    );
    if (!appointment) fail("No encontramos ese turno.", 404);
    if (
      (user.rol === "PACIENTE" && appointment.paciente?.id !== user.id) ||
      (user.rol === "MEDICO" && appointment.doctor.id !== user.id)
    ) {
      fail("No tenés permiso para modificar este turno.", 403);
    }
    const transitions = {
      RESERVADO: ["CONFIRMADO", "CANCELADO_PACIENTE", "CANCELADO_MEDICO"],
      CONFIRMADO: [
        "ATENDIDO",
        "AUSENTE",
        "CANCELADO_PACIENTE",
        "CANCELADO_MEDICO",
      ],
    };
    if (!transitions[appointment.estado]?.includes(body.estadoDestino)) {
      fail("No se permite esa transición de estado.", 409);
    }
    if (
      (user.rol === "PACIENTE" &&
        body.estadoDestino !== "CANCELADO_PACIENTE") ||
      (user.rol === "MEDICO" &&
        body.estadoDestino === "CANCELADO_PACIENTE")
    ) {
      fail("No tenés permiso para esa transición de estado.", 403);
    }
    if (
      ["CANCELADO_PACIENTE", "CANCELADO_MEDICO"].includes(body.estadoDestino) &&
      !body.motivo?.trim()
    ) {
      fail("Ingresá un motivo para cancelar.", 400, {
        motivo: "El motivo es obligatorio.",
      });
    }
    appointment.estado = body.estadoDestino;
    return { ...appointment };
  }
  if (route === "/turnos/sobreturno" && method === "POST") {
    const user = profile(data, session);
    requireRole(user, "MEDICO", "ADMIN");
    const doctorId = user.rol === "MEDICO" ? user.id : body.doctor?.id;
    const patient = data.patients.find(
      ({ id }) => id === body.paciente?.id,
    );
    if (!data.doctors.some(({ id }) => id === doctorId) || !patient) {
      fail("No encontramos al profesional o paciente indicado.", 404);
    }
    if (!body.justificacionSobreturned?.trim()) {
      fail("La justificación es obligatoria.", 400, {
        justificacionSobreturned: "Ingresá una justificación.",
      });
    }
    if (
      body.fechaHoraInicio <= argentinaDateTime() ||
      body.fechaHoraFin <= argentinaDateTime() ||
      body.fechaHoraFin <= body.fechaHoraInicio
    ) {
      fail("El horario del sobreturno debe ser futuro y tener una duración válida.", 400);
    }
    const conflicts = data.appointments.content.some(
      (appointment) =>
        appointment.doctor.id === doctorId &&
        appointment.fechaHoraInicio < body.fechaHoraFin &&
        appointment.fechaHoraFin > body.fechaHoraInicio &&
        !["CANCELADO_PACIENTE", "CANCELADO_MEDICO"].includes(
          appointment.estado,
        ),
    );
    if (conflicts) fail("El horario del profesional ya está ocupado.", 409);
    const response = {
      id: data.nextIds.appointment++,
      doctor: { id: doctorId },
      paciente: { id: patient.id },
      fechaHoraInicio: body.fechaHoraInicio,
      fechaHoraFin: body.fechaHoraFin,
      estado: "RESERVADO",
      esSobreturned: true,
      justificacionSobreturned: body.justificacionSobreturned,
    };
    data.appointments.content.push(response);
    return response;
  }
  if (route === "/admin/especialidades" && method === "POST") {
    const user = profile(data, session);
    requireRole(user, "ADMIN");
    if (!body.nombre?.trim()) {
      fail("El nombre de la especialidad es obligatorio.", 400, {
        nombre: "El nombre de la especialidad es obligatorio.",
      });
    }
    const specialty = {
      id: data.nextIds.specialty++,
      nombre: body.nombre.trim(),
      descripcion: body.descripcion ?? null,
    };
    data.specialties.push(specialty);
    return specialty;
  }
  if (route === "/admin/doctores" && method === "POST") {
    const user = profile(data, session);
    requireRole(user, "ADMIN");
    const specialty = data.specialties.find(
      ({ id }) => id === Number(body.especialidadId),
    );
    if (!specialty) fail("No encontramos esa especialidad.", 404);
    const doctor = {
      id: data.nextIds.doctor++,
      nombre: body.nombre,
      apellido: body.apellido,
      matriculaNacional: body.matriculaNacional,
      especialidadId: specialty.id,
      especialidadNombre: specialty.nombre,
    };
    data.doctors.push(doctor);
    return doctor;
  }
  const scheduleMatch = route.match(/^\/admin\/doctores\/(\d+)\/horarios$/);
  if (scheduleMatch && method === "PUT") {
    const user = profile(data, session);
    requireRole(user, "ADMIN");
    const doctorId = Number(scheduleMatch[1]);
    if (!data.doctors.some(({ id }) => id === doctorId)) {
      fail("No encontramos ese profesional.", 404);
    }
    if (!Array.isArray(body)) fail("La agenda debe ser una lista.", 400);
    const schedules = body.map((schedule) => ({
      id: data.nextIds.schedule++,
      ...schedule,
    }));
    data.schedules[doctorId] = schedules;
    return schedules;
  }
  fail("La operación no existe en el modo estático.", 404);
}
