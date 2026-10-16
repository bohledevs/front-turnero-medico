import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/auth";
import { api } from "../services/api";
import { addDays, passwordError, today } from "../lib/domain";
import Field from "../components/Field";
import { Alert } from "../components/Feedback";
function AuthFrame({ title, description, children }) {
  return (
    <div className="container auth-layout">
      <aside className="auth-aside">
        <span className="eyebrow">
          <HeartPulse size={20} /> CUIDARTE EMPIEZA ACÁ
        </span>
        <h2>
          Más cerca <br />
          de sentirte <br />
          <em>bien.</em>
        </h2>
        <p>Tu atención, tus horarios y tu tranquilidad, en un mismo lugar.</p>
        <div>
          <ShieldCheck size={20} /> Acceso personal y seguro
        </div>
      </aside>
      <section className="auth-panel">
        <h1>{title}</h1>
        <p className="muted">{description}</p>
        {children}
      </section>
    </div>
  );
}
export function Login() {
  const { user, login, expired } = useAuth();
  const location = useLocation();

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (user) {
    const target = location.state?.from;
    const destination =
      target?.startsWith("/") && !target.startsWith("//")
        ? target
        : user.rol === "PACIENTE"
          ? "/mis-turnos"
          : "/agenda";
    return <Navigate to={destination} replace />;
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await login(values);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame
      title="Te damos la bienvenida"
      description="Ingresá para gestionar tus turnos."
    >
      {expired && (
        <Alert>Tu sesión venció. Ingresá nuevamente para continuar.</Alert>
      )}
      {location.state?.registered && (
        <Alert success>Tu cuenta está lista. Ya podés ingresar.</Alert>
      )}
      <form onSubmit={submit} className="stack">
        <Field
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="tu@email.com"
          required
          error={error?.fieldErrors?.email}
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={error?.fieldErrors?.password}
        />
        <Alert>{error?.message}</Alert>
        <button className="button full" disabled={busy}>
          {busy ? "Ingresando…" : "Ingresar"}
          <ArrowRight size={18} />
        </button>
      </form>
      <p className="auth-switch">
        ¿Todavía no tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </AuthFrame>
  );
}
export function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  const props = (name) => ({
    name,
    error: error?.fieldErrors?.[name],
  });
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const issue = passwordError(values.password);
    if (issue || values.password !== values.confirmPassword) {
      setError({
        message: issue || "Las contraseñas no coinciden.",
        fieldErrors: {
          [issue ? "password" : "confirmPassword"]:
            issue || "Repetí la misma contraseña.",
        },
      });
      return;
    }
    setBusy(true);
    setError(null);
    const { confirmPassword: _confirmation, ...body } = values;
    try {
      await api.register({ ...body, telefono: body.telefono || null });
      navigate("/ingresar", { state: { registered: true }, replace: true });
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthFrame
      title="Creá tu cuenta"
      description="Registrate como paciente y empezá a organizar tu atención."
    >
      <form onSubmit={submit} className="stack">
        <div className="form-grid">
          <Field
            label="Nombre"
            {...props("nombre")}
            autoComplete="given-name"
            maxLength={100}
            required
          />
          <Field
            label="Apellido"
            {...props("apellido")}
            autoComplete="family-name"
            maxLength={100}
            required
          />
          <Field
            label="DNI"
            {...props("dni")}
            inputMode="numeric"
            pattern="[0-9]{7,8}"
            maxLength={8}
            hint="7 u 8 dígitos, sin puntos."
            required
          />
          <Field
            label="Fecha de nacimiento"
            {...props("fechaNacimiento")}
            type="date"
            max={addDays(today(), -1)}
            required
          />
          <Field
            label="Correo electrónico"
            {...props("email")}
            type="email"
            autoComplete="email"
            maxLength={150}
            required
          />
          <Field
            label="Teléfono (opcional)"
            {...props("telefono")}
            type="tel"
            pattern="[0-9]{6,20}"
            autoComplete="tel"
            hint="Solo números, entre 6 y 20 dígitos."
          />
          <Field
            label="Contraseña"
            {...props("password")}
            type="password"
            minLength={8}
            autoComplete="new-password"
            hint="Al menos 8 caracteres; hasta 72 bytes."
            required
          />
          <Field
            label="Repetir contraseña"
            {...props("confirmPassword")}
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        <Alert>{error?.message}</Alert>
        <button className="button full" disabled={busy}>
          {busy ? "Creando cuenta…" : "Crear mi cuenta"}
          <ArrowRight size={18} />
        </button>
      </form>
      <p className="auth-switch">
        ¿Ya tenés cuenta? <Link to="/ingresar">Ingresá</Link>
      </p>
    </AuthFrame>
  );
}
