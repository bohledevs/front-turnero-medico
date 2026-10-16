import { useCallback, useState } from "react";
import { BadgeCheck, Plus, Stethoscope } from "lucide-react";
import { api } from "../services/api";
import useResource from "../hooks/useResource";
import { fullName, passwordError } from "../lib/domain";
import PageHeading from "../components/PageHeading";
import Field from "../components/Field";
import Modal from "../components/Modal";
import ScheduleEditor from "../components/ScheduleEditor";
import {
  Alert,
  EmptyState,
  Loading,
  ResourceError,
} from "../components/Feedback";
function CreateForm({ type, specialties, onClose, onSaved }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (type === "doctor") {
      const issue = passwordError(values.password);
      if (issue) {
        setError({ message: issue, fieldErrors: { password: issue } });
        return;
      }
      values.especialidadId = Number(values.especialidadId);
      values.telefono = values.telefono || null;
    }
    setBusy(true);
    setError(null);
    try {
      await (type === "doctor"
        ? api.createDoctor(values)
        : api.createSpecialty(values));
      onSaved();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  const errorFor = (name) => error?.fieldErrors?.[name];
  return (
    <Modal
      title={type === "doctor" ? "Agregar profesional" : "Agregar especialidad"}
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="stack">
        <div className="form-grid">
          <Field
            label="Nombre"
            name="nombre"
            required
            maxLength={100}
            error={errorFor("nombre")}
          />
          {type === "doctor" ? (
            <>
              <Field
                label="Apellido"
                name="apellido"
                required
                maxLength={100}
                error={errorFor("apellido")}
              />
              <Field
                label="DNI"
                name="dni"
                pattern="[0-9]{7,8}"
                maxLength={8}
                inputMode="numeric"
                required
                error={errorFor("dni")}
              />
              <Field
                label="Matrícula nacional"
                name="matriculaNacional"
                maxLength={50}
                required
                error={errorFor("matriculaNacional")}
              />
              <Field
                label="Correo electrónico"
                name="email"
                type="email"
                autoComplete="off"
                maxLength={150}
                required
                error={errorFor("email")}
              />
              <Field
                label="Contraseña inicial"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                error={errorFor("password")}
              />
              <Field
                label="Teléfono (opcional)"
                name="telefono"
                pattern="[0-9]{6,20}"
                maxLength={20}
                error={errorFor("telefono")}
              />
              <Field
                as="select"
                label="Especialidad"
                name="especialidadId"
                required
                error={errorFor("especialidadId")}
              >
                <option value="">Seleccionar</option>
                {specialties.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </Field>
            </>
          ) : (
            <Field
              as="textarea"
              label="Descripción (opcional)"
              name="descripcion"
              rows={3}
              maxLength={255}
              error={errorFor("descripcion")}
            />
          )}
        </div>
        <Alert>{error?.message}</Alert>
        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Volver
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export default function Administration() {
  const [tab, setTab] = useState("doctors");
  const [modal, setModal] = useState(null);
  const [doctorId, setDoctorId] = useState("");
  const [message, setMessage] = useState("");
  const resource = useResource(
    useCallback(
      (signal) =>
        Promise.all([api.doctors({}, signal), api.specialties(signal)]),
      [],
    ),
  );
  const [doctors = [], specialties = []] = resource.data || [];
  return (
    <div className="container page">
      <PageHeading
        eyebrow="ADMINISTRACIÓN"
        title="Un consultorio, bien organizado."
        description="Gestioná la oferta de atención y los horarios de cada profesional."
      />
      <Alert success>{message}</Alert>
      <div
        className="tabs"
        role="group"
        aria-label="Secciones de administración"
      >
        {[
          ["doctors", "Profesionales"],
          ["specialties", "Especialidades"],
          ["schedule", "Agenda semanal"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ResourceError error={resource.error} retry={resource.reload} />
      ) : (
        <section className="admin-panel">
          <div className="section-heading">
            <div>
              <h2>
                {tab === "doctors"
                  ? "Equipo de profesionales"
                  : tab === "specialties"
                    ? "Especialidades del consultorio"
                    : "Configurar horarios de atención"}
              </h2>
              <p className="muted">
                {tab === "doctors"
                  ? doctors.length + " profesionales activos"
                  : tab === "specialties"
                    ? specialties.length + " especialidades disponibles"
                    : "Las franjas se repiten cada semana."}
              </p>
            </div>
            {tab !== "schedule" && (
              <button
                className="button"
                onClick={() =>
                  setModal(tab === "doctors" ? "doctor" : "specialty")
                }
                disabled={tab === "doctors" && !specialties.length}
              >
                <Plus size={17} />
                {tab === "doctors"
                  ? "Agregar profesional"
                  : "Agregar especialidad"}
              </button>
            )}
          </div>
          {tab === "doctors" &&
            (!doctors.length ? (
              <EmptyState title="El equipo está por comenzar">
                {specialties.length
                  ? "Agregá el primer profesional."
                  : "Primero creá una especialidad en la pestaña Especialidades."}
              </EmptyState>
            ) : (
              <div className="admin-list">
                {doctors.map((doctor) => (
                  <article key={doctor.id}>
                    <span className="empty-icon">
                      <Stethoscope size={22} />
                    </span>
                    <div>
                      <h3>{fullName(doctor)}</h3>
                      <p>
                        {doctor.especialidadNombre} · Matrícula{" "}
                        {doctor.matriculaNacional}
                      </p>
                      <small>Profesional Nº {doctor.id}</small>
                    </div>
                    <button
                      className="button secondary small"
                      onClick={() => {
                        setDoctorId(String(doctor.id));
                        setTab("schedule");
                      }}
                    >
                      Configurar agenda
                    </button>
                  </article>
                ))}
              </div>
            ))}
          {tab === "specialties" &&
            (!specialties.length ? (
              <EmptyState title="Todavía no hay especialidades">
                Agregá una especialidad para comenzar.
              </EmptyState>
            ) : (
              <div className="specialty-grid">
                {specialties.map((item) => (
                  <article className="specialty-card" key={item.id}>
                    <BadgeCheck size={22} />
                    <h3>{item.nombre}</h3>
                    <p>{item.descripcion || "Sin descripción adicional."}</p>
                  </article>
                ))}
              </div>
            ))}
          {tab === "schedule" && (
            <>
              <Field
                as="select"
                label="Profesional"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                <option value="">Seleccioná un profesional</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {fullName(doctor)} · {doctor.especialidadNombre}
                  </option>
                ))}
              </Field>
              {doctorId ? (
                <ScheduleEditor key={doctorId} doctorId={doctorId} />
              ) : (
                <EmptyState title="Elegí un profesional">
                  Seleccioná a quién querés configurar la agenda semanal.
                </EmptyState>
              )}
            </>
          )}
        </section>
      )}
      {modal && (
        <CreateForm
          type={modal}
          specialties={specialties}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            setMessage("El registro se creó correctamente.");
            resource.reload();
          }}
        />
      )}
    </div>
  );
}
