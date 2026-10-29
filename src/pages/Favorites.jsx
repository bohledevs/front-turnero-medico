import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import DoctorCard from "../components/DoctorCard";
import { EmptyState } from "../components/Feedback";
import PageHeading from "../components/PageHeading";
import {
  clearFavorites,
  selectFavorites,
} from "../store/slices/favoriteSlice.js";

/** Lista los profesionales seleccionados y permite vaciar el slice compartido. */
export default function Favorites() {
  const favorites = useSelector(selectFavorites);
  const dispatch = useDispatch();

  return (
    <div className="container page">
      <PageHeading
        eyebrow="TU SELECCIÓN"
        title="Tus profesionales favoritos."
        description="Tené a mano los profesionales que querés volver a consultar."
        action={
          favorites.length > 0 && (
            <button
              type="button"
              className="button secondary small"
              onClick={() => dispatch(clearFavorites())}
            >
              Vaciar favoritos
            </button>
          )
        }
      />
      <p className="muted">
        Esta selección dura mientras navegás. Se borra al recargar la página o
        cambiar de sesión.
      </p>
      <section aria-label="Profesionales favoritos">
        <div className="results-heading">
          <h2>Tu selección</h2>
          <span role="status">
            {favorites.length} profesional{favorites.length !== 1 ? "es" : ""}
          </span>
        </div>
        {favorites.length ? (
          <div className="directory-grid">
            {favorites.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Todavía no tenés favoritos"
            action={
              <Link className="button" to="/profesionales">
                Buscar profesionales
              </Link>
            }
          >
            Agregá profesionales desde sus tarjetas o desde su perfil.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
