import { useCallback, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/auth";
import useResource from "../hooks/useResource";
import {
  addDays,
  formatDate,
  formatTime,
  fullName,
  initials,
  isValidDate,
  today,
} from "../lib/domain";
import {
  Alert,
  EmptyState,
  Loading,
  ResourceError,
} from "../components/Feedback";
import Field from "../components/Field";
import Modal from "../components/Modal";
export default function ProfessionalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestedDate = params.get("fecha");
  const date =
    isValidDate(requestedDate) && requestedDate >= today()
      ? requestedDate
      : today();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const doctors = useResource(
    useCallback((signal) => api.doctors({}, signal), []),
  );
  const slots = useResource(
    useCallback(
      (signal) => api.availability({ doctorId: id, fecha: date }, signal),
      [id, date],
    ),
  );
  const doctor = doctors.data?.find((item) => String(item.id) === id);
  if (doctors.loading)
    return (
      <div className="container page">
        <Loading />
      </div>
    );
  if (doctors.error)
    return (
      <div className="container page">
        <ResourceError error={doctors.error} retry={doctors.reload} />
      </div>
    );
  if (!doctor)
    return (
      <div className="container page">
        <EmptyState
          title="Profesional no encontrado"
          action={
            <Link className="button" to="/profesionales">
              Volver a profesionales
            </Link>
          }
        >
          No pudimos encontrar este perfil.
        </EmptyState>
      </div>
    );
  async function reserve() {
    setBusy(true);
    setError(null);
    try {
      const appointment = await api.reserve({
        doctor: { id: doctor.id },
        fechaHoraInicio: selected.fechaHoraInicio,
      });
      navigate("/mis-turnos", {
        state: { booked: appointment.id },
        replace: true,
      });
    } catch (failure) {
      setError(failure);
      if (failure.status === 409 || failure.status === 400) {
        setSelected(null);
        slots.reload();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container page">
      <Link className="back-link" to="/profesionales">
        <ArrowLeft size={17} /> Todos los profesionales
      </Link>
      <div className="profile-layout">
        <aside className="profile-card">
          <div className={"avatar doctor-avatar large tone-" + (doctor.id % 4)}>
            {initials(doctor)}
          </div>
          <span className="eyebrow">{doctor.especialidadNombre}</span>
          <h1>{fullName(doctor)}</h1>
          <p className="with-icon">
            <BadgeCheck size={17} /> Matrícula {doctor.matriculaNacional}
          </p>
          <div className="profile-divider" />
          <h3>Tu próxima consulta</h3>
          <p>
            Elegí una fecha para ver los horarios disponibles de este
            profesional.
          </p>
          <div className="profile-detail">
            <CalendarDays size={18} />
            <span>Horarios actualizados al consultar</span>
          </div>
          <div className="profile-detail">
            <ShieldCheck size={18} />
            <span>Reserva con confirmación</span>
          </div>
        </aside>
        <section className="availability-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">DISPONIBILIDAD</span>
              <h2>Encontrá tu momento.</h2>
              <p className="muted">
                Todos los horarios corresponden a Buenos Aires.
              </p>
            </div>
          </div>
          <Field
            label="Fecha de la consulta"
            type="date"
            value={date}
            min={today()}
            onChange={(event) => {
              if (event.target.value) {
                setParams({ fecha: event.target.value });
                setSelected(null);
                setError(null);
              }
            }}
          />
          <div className="date-strip">
            {Array.from({ length: 7 }, (_, i) => addDays(today(), i)).map(
              (value) => (
                <button
                  key={value}
                  className={"date-chip " + (date === value ? "selected" : "")}
                  onClick={() => {
                    setParams({ fecha: value });
                    setSelected(null);
                    setError(null);
                  }}
                  aria-pressed={date === value}
                >
                  <span>
                    {formatDate(value, {
                      weekday: "short",
                      day: undefined,
                      month: undefined,
                    })}
                  </span>
                  <strong>{value.slice(8)}</strong>
                  <small>
                    {formatDate(value, { month: "short", day: undefined })}
                  </small>
                </button>
              ),
            )}
          </div>
          <div className="results-heading">
            <h3>{formatDate(date, { weekday: "long" })}</h3>
            <span>
              <Clock size={14} /> Horarios de atención
            </span>
          </div>
          <Alert>{error?.message}</Alert>
          {slots.loading ? (
            <Loading label="Consultando horarios…" />
          ) : slots.error ? (
            <ResourceError error={slots.error} retry={slots.reload} />
          ) : !slots.data?.length ? (
            <EmptyState title="Sin horarios para esta fecha">
              Probá con otro día para encontrar tu próximo turno.
            </EmptyState>
          ) : (
            <>
              <div className="slots">
                {slots.data.map((slot) => (
                  <button
                    key={slot.fechaHoraInicio}
                    className={
                      "slot " +
                      (selected?.fechaHoraInicio === slot.fechaHoraInicio
                        ? "selected"
                        : "")
                    }
                    aria-pressed={
                      selected?.fechaHoraInicio === slot.fechaHoraInicio
                    }
                    onClick={() => {
                      setSelected(slot);
                      setError(null);
                    }}
                  >
                    <Clock size={15} />
                    {formatTime(slot.fechaHoraInicio)}
                    {selected?.fechaHoraInicio === slot.fechaHoraInicio && (
                      <Check size={15} />
                    )}
                  </button>
                ))}
              </div>
              <p className="availability-note">
                El horario se confirma al completar la reserva.
              </p>
            </>
          )}
          {!user && (
            <div className="inline-callout">
              <div>
                <strong>Tu turno, a un paso.</strong>
                <p>Ingresá con tu cuenta de paciente para reservar.</p>
              </div>
              <Link
                to="/ingresar"
                state={{ from: location.pathname + location.search }}
                className="button"
              >
                Ingresar <ArrowRight size={16} />
              </Link>
            </div>
          )}
          {user && user.rol !== "PACIENTE" && (
            <div className="help-note">
              Estás consultando disponibilidad con una cuenta de{" "}
              {user.rol === "ADMIN" ? "administración" : "profesional"}. Las
              reservas regulares se realizan desde la cuenta del paciente.
            </div>
          )}
        </section>
      </div>
      {selected && user?.rol === "PACIENTE" && (
        <Modal
          title="Confirmá tu turno"
          busy={busy}
          onClose={() => setSelected(null)}
        >
          <div className="booking-summary">
            <span className="avatar">{initials(doctor)}</span>
            <div>
              <h3>{fullName(doctor)}</h3>
              <p>{doctor.especialidadNombre}</p>
            </div>
          </div>
          <div className="booking-details">
            <p>
              <CalendarDays size={18} />
              {formatDate(selected.fechaHoraInicio, {
                weekday: "long",
                year: "numeric",
              })}
            </p>
            <p>
              <Clock size={18} />
              {formatTime(selected.fechaHoraInicio)} a{" "}
              {formatTime(selected.fechaHoraFin)} · Buenos Aires
            </p>
          </div>
          <p className="muted">
            La reserva quedará a nombre de {fullName(user)}.
          </p>
          <Alert>{error?.message}</Alert>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setSelected(null)}
              disabled={busy}
            >
              Volver
            </button>
            <button className="button" onClick={reserve} disabled={busy}>
              {busy ? "Reservando…" : "Confirmar reserva"}
              <Check size={17} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
