import {
  Navigate,
  Outlet,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./context/auth";
import Layout from "./components/Layout";
import { EmptyState } from "./components/Feedback";
import Home from "./pages/Home";
import { Login, Register } from "./pages/AuthPages";
import Professionals from "./pages/Professionals";
import ProfessionalDetail from "./pages/ProfessionalDetail";
import Appointments from "./pages/Appointments";
import Administration from "./pages/Administration";
import Favorites from "./pages/Favorites";
function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user)
    return (
      <Navigate
        to="/ingresar"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  if (!roles.includes(user.rol))
    return (
      <div className="container page">
        <EmptyState
          title="Este espacio pertenece a otro perfil"
          action={
            <Link to="/" className="button">
              Volver al inicio
            </Link>
          }
        >
          Tu cuenta no tiene acceso a esta sección.
        </EmptyState>
      </div>
    );
  return <Outlet />;
}
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="profesionales" element={<Professionals />} />
        <Route path="profesionales/:id" element={<ProfessionalDetail />} />
        <Route path="favoritos" element={<Favorites />} />
        <Route path="ingresar" element={<Login />} />
        <Route path="registro" element={<Register />} />
        <Route element={<ProtectedRoute roles={["PACIENTE"]} />}>
          <Route path="mis-turnos" element={<Appointments />} />
        </Route>
        <Route element={<ProtectedRoute roles={["MEDICO", "ADMIN"]} />}>
          <Route path="agenda" element={<Appointments staff />} />
        </Route>
        <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
          <Route path="administracion" element={<Administration />} />
        </Route>
        <Route
          path="*"
          element={
            <div className="container page">
              <EmptyState
                title="No encontramos esta página"
                action={
                  <Link to="/" className="button">
                    Volver al inicio
                  </Link>
                }
              >
                Revisá la dirección o continuá desde el inicio.
              </EmptyState>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
