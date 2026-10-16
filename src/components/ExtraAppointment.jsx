import { useState } from "react";
import { api } from "../services/api";
import { fullName, isFuture, today } from "../lib/domain";
import Modal from "./Modal";
import Field from "./Field";
import { Alert } from "./Feedback";
export default function ExtraAppointment({ user, doctors, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const start = values.fecha + "T" + values.inicio + ":00",
      end = values.fecha + "T" + values.fin + ":00";
    if (!isFuture(start) || end <= start) {
      setError({
        message: "Elegí un inicio futuro y un horario de fin posterior.",
      });
      return;
    }
    if (!values.justificacion.trim()) {
      setError({ message: "Ingresá el motivo del sobreturno." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.extraAppointment({
        ...(user.rol === "ADMIN"
          ? { doctor: { id: Number(values.doctorId) } }
          : {}),
        paciente: { id: Number(values.pacienteId) },
        fechaHoraInicio: start,
        fechaHoraFin: end,
        justificacionSobreturned: values.justificacion.trim(),
      });
      onSaved();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Agregar sobreturno" onClose={onClose} busy={busy}>
      <p className="muted">
        Asigná un horario adicional con una justificación. Horarios de Buenos
        Aires.
      </p>
      <form onSubmit={submit} className="stack">
        {user.rol === "ADMIN" && (
          <Field as="select" label="Profesional" name="doctorId" required>
            <option value="">Seleccionar profesional</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {fullName(doctor)}
              </option>
            ))}
          </Field>
        )}
        <Field
          label="Número de paciente"
          name="pacienteId"
          type="number"
          min="1"
          step="1"
          required
          hint="Debe corresponder a un paciente registrado. Su número aparece en Mis turnos."
        />
        <div className="form-grid">
          <Field
            label="Fecha"
            name="fecha"
            type="date"
            min={today()}
            required
          />
          <Field label="Hora de inicio" name="inicio" type="time" required />
          <Field label="Hora de fin" name="fin" type="time" required />
        </div>
        <Field
          as="textarea"
          label="Justificación"
          name="justificacion"
          maxLength={2000}
          rows={3}
          required
        />
        <Alert>{error?.message}</Alert>
        <div className="modal-actions">
          <button
            className="button secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            Volver
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Guardando…" : "Crear sobreturno"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
