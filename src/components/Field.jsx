import { useId } from "react";
export default function Field({
  label,
  error,
  hint,
  children,
  as = "input",
  ...props
}) {
  const generated = useId();
  const id = props.id || generated;
  const Control = as;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {props.required && (
          <span className="required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      <Control
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? id + "-hint" : undefined}
      >
        {children}
      </Control>
      {(error || hint) && (
        <small
          id={id + "-hint"}
          className={error ? "field-error" : "field-hint"}
        >
          {error || hint}
        </small>
      )}
    </div>
  );
}
