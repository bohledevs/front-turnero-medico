import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/auth";
import { api } from "../services/api";
import useResource from "../hooks/useResource";
import {
  STATUS,
  addDays,
  allowedTransitions,
  formatDate,
  formatTime,
  fullName,
  today,
  nowLocal,
} from "../lib/domain";
import PageHeading from "../components/PageHeading";
import Field from "../components/Field";
import {
  Alert,
  EmptyState,
  Loading,
  ResourceError,
} from "../components/Feedback";
import AppointmentActions from "../components/AppointmentActions";
import ExtraAppointment from "../components/ExtraAppointment";
const actionLabels = {
  CONFIRMADO: "Confirmar",
  ATENDIDO: "Marcar atendido",
  AUSENTE: "Marcar ausente",
  CANCELADO_PACIENTE: "Cancelar",
  CANCELADO_MEDICO: "Cancelar como profesional",
};
export default function Appointments({ staff = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const [period, setPeriod] = useState("upcoming");
  const [date, setDate] = useState(staff ? today() : "");
  const [status, setStatus] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [page, setPage] = useState(0);
  const [action, setAction] = useState(null);
  const [extra, setExtra] = useState(false);
  const [message, setMessage] = useState(
    location.state?.booked
      ? "Tu turno se reservó correctamente. Podés verlo a continuación."
      : "",
  );
  const doctors = useResource(
    useCallback((signal) => api.doctors({}, signal), []),
  );
  const appointments = useResource(
    useCallback(
      (signal) =>
        api.appointments(
          {
            page,
            size: 8,
            estado: status,
            doctorId,
            fechaDesde: date
              ? date + "T00:00:00"
              : !staff && period === "upcoming"
                ? nowLocal()
                : undefined,
            fechaHasta: date ? date + "T23:59:59" : undefined,
            sort:
              !staff && period === "all"
                ? "fechaHoraInicio,desc"
                : "fechaHoraInicio,asc",
          },
          signal,
        ),
      [page, status, doctorId, date, staff, period],
    ),
  );
  const data = appointments.data;
  function changed(setter, value) {
    setter(value);
    setPage(0);
  }
  function saved(text) {
    setAction(null);
    setExtra(false);
    setMessage(text);
    appointments.reload();
  }
  return (
    <div className="container page">
      <PageHeading
        eyebrow={staff ? "ESPACIO PROFESIONAL" : "TU ATENCIÓN, ORGANIZADA"}
        title={
          staff
            ? user.rol === "ADMIN"
              ? "Agenda del consultorio"
              : "Mi agenda"
            : "Mis turnos"
        }
        description={
          staff
            ? "Consultá las consultas y acompañá cada paso de la atención."
            : "Tus próximas consultas y el historial de tu atención, en un solo lugar."
        }
        action={
          staff ? (
            <button className="button" onClick={() => setExtra(true)}>
              <Plus size={17} />
              Agregar sobreturno
            </button>
          ) : (
            <Link className="button" to="/profesionales">
              <Plus size={17} />
              Reservar un turno
            </Link>
          )
        }
      />
      {!staff && (
        <p className="patient-number">
          Paciente Nº {user.id} · {fullName(user)}
        </p>
      )}
      <Alert success>{message}</Alert>
      {!staff && (
        <div className="tabs" role="group" aria-label="Período">
          <button
            className={period === "upcoming" ? "active" : ""}
            onClick={() => {
              changed(setPeriod, "upcoming");
              setDate("");
            }}
          >
            Próximos turnos
          </button>
          <button
            className={period === "all" ? "active" : ""}
            onClick={() => {
              changed(setPeriod, "all");
              setDate("");
            }}
          >
            Todos / historial
          </button>
        </div>
      )}
      <div className="appointments-filters">
        {staff && (
          <div className="day-nav">
            <button
              className="icon-button"
              aria-label="Día anterior"
              onClick={() => changed(setDate, addDays(date || today(), -1))}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="button secondary small"
              onClick={() => changed(setDate, today())}
            >
              Hoy
            </button>
            <button
              className="icon-button"
              aria-label="Día siguiente"
              onClick={() => changed(setDate, addDays(date || today(), 1))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        <Field
          label="Fecha"
          type="date"
          value={date}
          onChange={(event) => changed(setDate, event.target.value)}
        />
        <Field
          as="select"
          label="Estado"
          value={status}
          onChange={(event) => changed(setStatus, event.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Field>
        {user.rol === "ADMIN" && (
          <Field
            as="select"
            label="Profesional"
            value={doctorId}
            onChange={(event) => changed(setDoctorId, event.target.value)}
          >
            <option value="">Todos los profesionales</option>
            {doctors.data?.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {fullName(doctor)}
              </option>
            ))}
          </Field>
        )}
        {(date || status || doctorId) && (
          <button
            className="text-button"
            onClick={() => {
              setDate("");
              setStatus("");
              setDoctorId("");
              setPage(0);
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>
      {doctors.error && (
        <ResourceError error={doctors.error} retry={doctors.reload} />
      )}
      <section className="appointments-panel">
        <div className="results-heading">
          <h2>
            <CalendarDays size={20} />
            {date
              ? formatDate(date, { weekday: "long" })
              : period === "all"
                ? "Historial de turnos"
                : "Tus consultas"}
          </h2>
          {!appointments.loading && data && (
            <span>
              {data.totalElements} turno{data.totalElements !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {appointments.loading ? (
          <Loading />
        ) : appointments.error ? (
          <ResourceError
            error={appointments.error}
            retry={appointments.reload}
          />
        ) : !data?.content?.length ? (
          <EmptyState
            title="No hay turnos para mostrar"
            action={
              !staff ? (
                <Link className="button secondary" to="/profesionales">
                  Encontrar un profesional <ArrowRight size={16} />
                </Link>
              ) : null
            }
          >
            Probá otra fecha o modificá los filtros.
          </EmptyState>
        ) : (
          <div className="appointment-list">
            {data.content.map((turn) => {
              const doctor = doctors.data?.find(
                (item) => item.id === turn.doctor.id,
              );
              const transitions = allowedTransitions(turn.estado, user.rol);
              return (
                <article className="appointment-row" key={turn.id}>
                  <div className="appointment-date">
                    <strong>{formatTime(turn.fechaHoraInicio)}</strong>
                    <span>
                      {formatDate(turn.fechaHoraInicio, { month: "short" })}
                    </span>
                  </div>
                  <div className="appointment-person">
                    <h3>
                      {doctor
                        ? fullName(doctor)
                        : "Profesional Nº " + turn.doctor.id}
                    </h3>
                    <p>
                      {doctor?.especialidadNombre || "Consulta médica"}
                      {staff && " · Paciente Nº " + (turn.paciente?.id ?? "—")}
                    </p>
                    <small>
                      Hasta {formatTime(turn.fechaHoraFin)} · Turno Nº {turn.id}
                      {turn.esSobreturned ? " · Sobreturno" : ""}
                    </small>
                  </div>
                  <div className="appointment-state">
                    <span
                      className={"status status-" + turn.estado.toLowerCase()}
                    >
                      {turn.estado === "ATENDIDO" && <Check size={13} />}{" "}
                      {STATUS[turn.estado] || turn.estado}
                    </span>
                    {turn.esSobreturned && turn.justificacionSobreturned && (
                      <p className="extra-reason">
                        {turn.justificacionSobreturned}
                      </p>
                    )}
                  </div>
                  <div className="appointment-actions">
                    {transitions.map((target) => (
                      <button
                        key={target}
                        className={
                          "text-button " +
                          (target.startsWith("CANCELADO") ? "danger-text" : "")
                        }
                        onClick={() => setAction({ appointment: turn, target })}
                      >
                        {user.rol === "ADMIN" && target === "CANCELADO_PACIENTE"
                          ? "Cancelar como paciente"
                          : actionLabels[target]}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {data && data.totalPages > 1 && (
          <div className="pagination">
            <button
              className="button secondary small"
              disabled={page === 0 || appointments.loading}
              onClick={() => setPage((value) => value - 1)}
            >
              <ArrowLeft size={16} />
              Anterior
            </button>
            <span>
              Página {page + 1} de {data.totalPages}
            </span>
            <button
              className="button secondary small"
              disabled={page + 1 >= data.totalPages || appointments.loading}
              onClick={() => setPage((value) => value + 1)}
            >
              Siguiente
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
      {action && (
        <AppointmentActions
          {...action}
          onClose={() => setAction(null)}
          onSaved={() => saved("El turno se actualizó correctamente.")}
        />
      )}
      {extra && (
        <ExtraAppointment
          user={user}
          doctors={doctors.data || []}
          onClose={() => setExtra(false)}
          onSaved={() =>
            saved(
              "El sobreturno se creó correctamente. Seleccioná su fecha para verlo.",
            )
          }
        />
      )}
    </div>
  );
}
