import { ArrowUpRight, BadgeCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { fullName, initials } from "../lib/domain";
import FavoriteButton from "./FavoriteButton";
export default function DoctorCard({ doctor, compact = false }) {
  return (
    <article className={"doctor-card " + (compact ? "compact" : "")}>
      <FavoriteButton doctor={doctor} />
      <div className={"avatar doctor-avatar tone-" + (doctor.id % 4)}>
        {initials(doctor)}
      </div>
      <div className="doctor-info">
        <span className="eyebrow">
          <Stethoscope size={13} />
          {doctor.especialidadNombre}
        </span>
        <h3>{fullName(doctor)}</h3>
        <p>
          <BadgeCheck size={15} /> Matrícula {doctor.matriculaNacional}
        </p>
      </div>
      <Link
        to={"/profesionales/" + doctor.id}
        className="button secondary small"
      >
        Ver disponibilidad <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}
