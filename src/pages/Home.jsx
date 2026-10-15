import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { api } from "../services/api";
import useResource from "../hooks/useResource";
import { useAuth } from "../context/auth";
import { fullName } from "../lib/domain";
import DoctorCard from "../components/DoctorCard";
import { EmptyState, Loading, ResourceError } from "../components/Feedback";
export default function Home() {
  const { user } = useAuth();
  const [specialty, setSpecialty] = useState("");
  const navigate = useNavigate();
  const resource = useResource(
    useCallback(
      (signal) =>
        Promise.all([api.specialties(signal), api.doctors({}, signal)]),
      [],
    ),
  );
  const [specialties = [], doctors = []] = resource.data || [];
  return (
    <div className="container home">
      {user && (
        <div className="welcome-bar">
          <span>
            Hola, <strong>{fullName(user)}</strong>. Qué bueno verte.
          </span>
          <Link to={user.rol === "PACIENTE" ? "/mis-turnos" : "/agenda"}>
            Ver {user.rol === "PACIENTE" ? "mis turnos" : "mi agenda"}{" "}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="live-dot" /> TU PRÓXIMO PASO ES CUIDARTE
          </span>
          <h1>
            Tu salud,
            <br />a tu <span>tiempo.</span>
          </h1>
          <p>
            Encontrá al profesional que necesitás y reservá tu próximo turno.
            Simple, claro y en un solo lugar.
          </p>
          <form
            className="hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              navigate(
                "/profesionales" +
                  (specialty ? "?especialidadId=" + specialty : ""),
              );
            }}
          >
            <label htmlFor="home-specialty" className="sr-only">
              Especialidad
            </label>
            <Stethoscope size={21} />
            <select
              id="home-specialty"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
            >
              <option value="">¿Qué especialidad buscás?</option>
              {specialties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
            <button className="button" type="submit">
              Buscar turno <ArrowRight size={17} />
            </button>
          </form>
          <div className="hero-note">
            <ShieldCheck size={17} /> Tu información, protegida. Tu agenda,
            organizada.
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-spark spark-one">+</span>
          <span className="art-spark spark-two">+</span>
          <div className="calendar-art">
            <div className="calendar-art-top">
              <span>UN ESPACIO PARA VOS</span>
              <CalendarDays size={22} />
            </div>
            <div className="calendar-art-body">
              <div className="calendar-title">
                Tu próximo turno <span>↗</span>
              </div>
              <div className="calendar-grid">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <b key={"d" + i}>{d}</b>
                ))}
                {Array.from({ length: 21 }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i === 10 ? "chosen" : i === 11 ? "soft-chosen" : ""
                    }
                  >
                    {i === 10 ? <Check size={22} /> : i + 1}
                  </span>
                ))}
              </div>
              <div className="art-time">
                <span className="live-dot" /> Elegí el momento para cuidarte
              </div>
            </div>
          </div>
          <div className="floating-note">
            <span>
              <CalendarCheck2 size={23} />
            </span>
            <div>
              <strong>Todo en un solo lugar</strong>
              <small>Buscá, reservá y organizate.</small>
            </div>
          </div>
        </div>
      </section>
      <section className="benefits-strip">
        <div>
          <Search />
          <span>
            <strong>Encontrá tu profesional</strong>
            <small>Buscá por nombre o especialidad</small>
          </span>
        </div>
        <div>
          <CalendarDays />
          <span>
            <strong>Elegí tu horario</strong>
            <small>Consultá la disponibilidad actual</small>
          </span>
        </div>
        <div>
          <CalendarCheck2 />
          <span>
            <strong>Gestioná tus turnos</strong>
            <small>Tu agenda siempre a mano</small>
          </span>
        </div>
      </section>
      <section className="home-doctors">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PROFESIONALES</span>
            <h2>El cuidado empieza con una elección.</h2>
          </div>
          <Link className="text-link" to="/profesionales">
            Ver todos <ArrowUpRight size={18} />
          </Link>
        </div>
        {resource.loading ? (
          <Loading />
        ) : resource.error ? (
          <ResourceError error={resource.error} retry={resource.reload} />
        ) : doctors.length ? (
          <div className="doctor-grid">
            {doctors.slice(0, 3).map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <EmptyState title="Estamos preparando la agenda">
            Los profesionales aparecerán acá cuando estén dados de alta.
          </EmptyState>
        )}
      </section>
      <section className="care-banner">
        <div>
          <span className="eyebrow">A TU RITMO</span>
          <h2>
            Una preocupación menos.
            <br />
            Un momento más para vos.
          </h2>
        </div>
        <div>
          <p>
            Consultá tus próximos turnos y mantené tu atención organizada desde
            cualquier dispositivo.
          </p>
          <Link
            className="button secondary"
            to={
              user
                ? user.rol === "PACIENTE"
                  ? "/mis-turnos"
                  : "/agenda"
                : "/registro"
            }
          >
            {user ? "Ir a mi agenda" : "Empezar ahora"} <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
