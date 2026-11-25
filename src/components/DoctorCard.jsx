
import {
  ArrowUpRight,
  BadgeCheck,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { fullName } from "../lib/domain";
import FavoriteButton from "./FavoriteButton";
import DoctorAvatar from "./DoctorAvatar";

export default function DoctorCard({
  doctor,
  compact = false,
}) {
  return (
    <article
      className={
        "doctor-card " + (compact ? "compact" : "")
      }
    >
      <FavoriteButton doctor={doctor} />

      {/* Fotografía o avatar con iniciales */}
      <DoctorAvatar doctor={doctor} />

      <div className="doctor-info">
        <span className="eyebrow">
          <Stethoscope size={13} />
          {doctor.especialidadNombre}
        </span>

        <h3>{fullName(doctor)}</h3>

        <p className="doctor-license">
          <BadgeCheck size={15} />
          Matrícula {doctor.matriculaNacional}
        </p>

        {/* Descripción del profesional */}
        <p className="doctor-description">
          {doctor.descripcion?.trim() ||
            "Conocé más sobre este profesional y sus horarios disponibles."}
        </p>
      </div>

      <Link
        to={"/profesionales/" + doctor.id}
        className="button secondary small"
      >
        Ver disponibilidad
        <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}
