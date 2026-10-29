import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  HeartPulse,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useAuth } from "../context/auth";
import { selectCantidadFavoritos } from "../store/slices/favoritosSlice";
import { ROLES, initials } from "../lib/domain";
import { getDataMode, resetDemo, setDataMode } from "../services/api";
export default function Layout() {
  const { user, logout } = useAuth();
  // La barra se suscribe SOLO a la cantidad de favoritos (un número)
  const cantidadFavoritos = useSelector(selectCantidadFavoritos);
  const [menu, setMenu] = useState(false);
  const [dataMode, setMode] = useState(getDataMode);
  const [notice, setNotice] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const close = () => setMenu(false);
  return (
    <div className="site">
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" onClick={close}>
            <span className="brand-mark">
              <HeartPulse size={25} />
            </span>
            turnera<span className="brand-dot">.</span>
          </Link>
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <nav
            className={menu ? "navigation open" : "navigation"}
            aria-label="Navegación principal"
          >
            <NavLink to="/" end onClick={close}>
              Inicio
            </NavLink>
            <NavLink to="/profesionales" onClick={close}>
              Profesionales
            </NavLink>
            <NavLink to="/favoritos" onClick={close}>
              Favoritos
              {cantidadFavoritos > 0 && (
                <span className="nav-badge">{cantidadFavoritos}</span>
              )}
            </NavLink>
            {user?.rol === "PACIENTE" && (
              <NavLink to="/mis-turnos" onClick={close}>
                Mis turnos
              </NavLink>
            )}
            {["MEDICO", "ADMIN"].includes(user?.rol) && (
              <NavLink to="/agenda" onClick={close}>
                Agenda
              </NavLink>
            )}
            {user?.rol === "ADMIN" && (
              <NavLink to="/administracion" onClick={close}>
                Administración
              </NavLink>
            )}
          </nav>
          <div className="header-account">
            {user ? (
              <>
                <div className="user-mini">
                  <span className="avatar">{initials(user)}</span>
                  <span>
                    <strong>{user.nombre}</strong>
                    <small>{ROLES[user.rol]}</small>
                  </span>
                </div>
                <button
                  className="icon-button"
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                  onClick={() => {
                    logout();
                    close();
                    navigate("/");
                  }}
                >
                  <LogOut size={19} />
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/ingresar">
                  Ingresar
                </Link>
                <Link className="button small" to="/registro">
                  Crear cuenta <ArrowUpRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="contenido" tabIndex="-1">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <Link className="brand" to="/">
            <HeartPulse size={22} />
            turnera.
          </Link>
          <p>Más simple. Más cerca de tu salud.</p>
        </div>
        <div className="data-source-control">
          <label htmlFor="data-source">Fuente de datos</label>
          <select
            id="data-source"
            value={dataMode}
            onChange={(event) => {
              const nextMode = event.target.value;
              setDataMode(nextMode);
              setMode(nextMode);
              setNotice(
                nextMode === "static"
                  ? "Demo local activa. Se cerró la sesión anterior."
                  : "API real activa. Ingresá para autenticarte en el backend.",
              );
            }}
          >
            <option value="static">Demo local</option>
            <option value="api">API real</option>
          </select>
          {dataMode === "static" && (
            <button
              className="text-button"
              type="button"
              onClick={() => {
                resetDemo();
                setNotice("Datos de la demo restablecidos.");
              }}
            >
              Restablecer demo
            </button>
          )}
          <span className="sr-only" role="status" aria-live="polite">
            {notice}
          </span>
        </div>
        <span>
          <CalendarDays size={15} /> Horarios de Buenos Aires · Argentina
        </span>
        <small>Turnero Médico · Aplicaciones Interactivas · UADE</small>
      </footer>
    </div>
  );
}
