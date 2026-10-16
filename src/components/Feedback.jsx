import { AlertCircle, CalendarDays, LoaderCircle } from "lucide-react";
export function Alert({ children, success = false }) {
  return children ? (
    <div
      className={"alert " + (success ? "alert-success" : "")}
      role={success ? "status" : "alert"}
    >
      <AlertCircle size={18} />
      <div>{children}</div>
    </div>
  ) : null;
}
export function Loading({ label = "Cargando información…" }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      {label}
    </div>
  );
}
export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <CalendarDays size={28} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function ResourceError({ error, retry }) {
  return (
    <div className="resource-error">
      <Alert>{error.message}</Alert>
      <button className="button secondary small" onClick={retry}>
        Volver a intentar
      </button>
    </div>
  );
}
