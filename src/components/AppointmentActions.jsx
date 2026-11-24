import { useState } from "react";
import { Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { STATUS, needsReason, formatDate, formatTime } from "../lib/domain";
import Field from "./Field";
import Modal from "./Modal";
import { Alert } from "./Feedback";
import {
  cambiarEstadoTurno,
  selectOperacionTurnosLoading,
} from "../store/slices/turnosSlice";
export default function AppointmentActions({
  appointment,
  target,
  onClose,
  onSaved,
}) {
  const dispatch = useDispatch();
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const busy = useSelector(selectOperacionTurnosLoading);
  const cancelling = target.startsWith("CANCELADO");
  async function submit(event) {
    event.preventDefault();
    setError(null);
    try {
      await dispatch(
        cambiarEstadoTurno({
          id: appointment.id,
          datos: {
            estadoDestino: target,
            motivo: reason.trim() || null,
          },
        }),
      ).unwrap();
      onSaved();
    } catch (failure) {
      setError(failure);
    }
  }
  return (
    <Modal
      title={cancelling ? "Cancelar turno" : "Actualizar turno"}
      onClose={onClose}
      busy={busy}
    >
      <p>
        Turno del {formatDate(appointment.fechaHoraInicio)} a las{" "}
        {formatTime(appointment.fechaHoraInicio)}.
      </p>
      <p className="muted">
        {cancelling
          ? "El turno quedará cancelado. Los horarios de atención habitual volverán a estar disponibles."
          : "El turno pasará a: " + STATUS[target] + "."}
      </p>
      <form onSubmit={submit} className="stack">
        <Field
          as="textarea"
          rows={3}
          label={needsReason(target) ? "Motivo" : "Motivo (opcional)"}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={2000}
          required={needsReason(target)}
          error={error?.fieldErrors?.motivo}
        />
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
          <button
            className={"button " + (cancelling ? "danger" : "")}
            disabled={busy || (needsReason(target) && !reason.trim())}
          >
            {busy
              ? "Guardando…"
              : cancelling
                ? "Confirmar cancelación"
                : "Guardar cambio"}
            <Check size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
