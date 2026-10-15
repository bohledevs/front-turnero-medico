import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { DAYS, validateSchedule } from "../lib/domain";
import Field from "./Field";
import { Alert } from "./Feedback";
const newRow = () => ({
  key: crypto.randomUUID(),
  diaSemana: "LUNES",
  horaInicio: "09:00",
  horaFin: "12:00",
  duracionTurnoMinutos: 30,
});
export default function ScheduleEditor({ doctorId }) {
  const [rows, setRows] = useState([newRow()]);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  function change(key, name, value) {
    setRows((previous) =>
      previous.map((row) =>
        row.key === key ? { ...row, [name]: value } : row,
      ),
    );
    setSaved(false);
  }
  async function submit(event) {
    event.preventDefault();
    const issue = validateSchedule(rows);
    if (issue) {
      setError({ message: issue });
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await api.replaceSchedule(
        doctorId,
        rows.map(({ key: _key, ...row }) => ({
          ...row,
          horaInicio: row.horaInicio + ":00",
          horaFin: row.horaFin + ":00",
          duracionTurnoMinutos: Number(row.duracionTurnoMinutos),
        })),
      );
      setSaved(true);
      setAccepted(false);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="stack">
      <div className="help-note">
        <strong>Definí la agenda semanal completa</strong>
        <p>
          Guardar reemplaza todas las franjas de este profesional. La agenda
          actual no se puede recuperar desde esta pantalla: cargá todos los días
          que querés mantener.
        </p>
      </div>
      {rows.map((row, index) => (
        <div className="schedule-row" key={row.key}>
          <Field
            as="select"
            label={"Día · franja " + (index + 1)}
            value={row.diaSemana}
            onChange={(event) =>
              change(row.key, "diaSemana", event.target.value)
            }
          >
            {DAYS.map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </Field>
          <Field
            label="Desde"
            type="time"
            value={row.horaInicio}
            onChange={(event) =>
              change(row.key, "horaInicio", event.target.value)
            }
            required
          />
          <Field
            label="Hasta"
            type="time"
            value={row.horaFin}
            onChange={(event) => change(row.key, "horaFin", event.target.value)}
            required
          />
          <Field
            label="Minutos por turno"
            type="number"
            min="1"
            max="720"
            step="1"
            value={row.duracionTurnoMinutos}
            onChange={(event) =>
              change(row.key, "duracionTurnoMinutos", event.target.value)
            }
            required
          />
          <button
            type="button"
            className="icon-button danger-text"
            aria-label={"Quitar franja " + (index + 1)}
            onClick={() => {
              setRows((previous) =>
                previous.filter((item) => item.key !== row.key),
              );
              setSaved(false);
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button secondary fit"
        onClick={() => {
          setRows((previous) => [...previous, newRow()]);
          setSaved(false);
        }}
      >
        <Plus size={17} />
        Agregar franja
      </button>
      {!rows.length && (
        <Alert>La agenda quedará sin horarios de atención.</Alert>
      )}
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          required
        />
        Entiendo que se reemplazará la agenda semanal completa de este
        profesional.
      </label>
      <Alert>{error?.message}</Alert>
      {saved && (
        <Alert success>
          Agenda guardada. La nueva disponibilidad ya se puede consultar.
        </Alert>
      )}
      <button className="button fit" disabled={busy || !accepted}>
        {busy ? "Guardando…" : "Guardar agenda completa"}
      </button>
    </form>
  );
}
