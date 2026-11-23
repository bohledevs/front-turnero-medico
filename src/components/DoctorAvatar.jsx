
import { useEffect, useState } from "react";
import { fullName, initials } from "../lib/domain";

/**
 * Muestra la fotografía del profesional.
 * Si no tiene foto o falla la carga, muestra sus iniciales.
 */
export default function DoctorAvatar({
  doctor,
  large = false,
}) {
  const [imageError, setImageError] = useState(false);

  const photo = doctor.fotoUrl?.trim();

  // Si cambia la foto, volvemos a intentar cargarla.
  useEffect(() => {
    setImageError(false);
  }, [photo]);

  const className = [
    "avatar",
    "doctor-avatar",
    large ? "large" : "",
    `tone-${Number(doctor.id) % 4}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {photo && !imageError ? (
        <img
          src={photo}
          alt={`Foto de ${fullName(doctor)}`}
          className="doctor-photo"
          loading="lazy"
          onError={() => setImageError(true)}
        />
      ) : (
        <span aria-label={`Iniciales de ${fullName(doctor)}`}>
          {initials(doctor)}
        </span>
      )}
    </div>
  );
}
