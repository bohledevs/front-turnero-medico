import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import DoctorCard from "../components/DoctorCard";
import PageHeading from "../components/PageHeading";
import { EmptyState } from "../components/Feedback";
import {
  selectCantidadFavoritos,
  selectFavoritosPorEspecialidad,
  vaciarFavoritos,
} from "../store/slices/favoritosSlice";

// Página "Mis favoritos": se suscribe a los favoritos agrupados por especialidad.
// El selector es memoizado, así que la página solo se vuelve a dibujar cuando cambian los favoritos.
export default function Favorites() {
  const cantidad = useSelector(selectCantidadFavoritos);
  const grupos = useSelector(selectFavoritosPorEspecialidad);
  const dispatch = useDispatch();

  return (
    <div className="container page">
      <PageHeading
        eyebrow="TUS PROFESIONALES"
        title="Mis favoritos"
        description="Los profesionales que guardaste para encontrarlos rápido."
        action={
          cantidad > 0 && (
            <button
              type="button"
              className="button secondary small"
              onClick={() => dispatch(vaciarFavoritos())}
            >
              Vaciar favoritos
            </button>
          )
        }
      />
      {cantidad === 0 ? (
        <EmptyState
          title="Todavía no tenés favoritos"
          action={
            <Link to="/profesionales" className="button">
              Buscar profesionales
            </Link>
          }
        >
          Tocá el corazón en la tarjeta de un profesional para guardarlo acá.
        </EmptyState>
      ) : (
        grupos.map(({ especialidad, doctores }) => (
          <section className="favoritos-grupo" key={especialidad}>
            <div className="results-heading">
              <h2>{especialidad}</h2>
              <span>
                {doctores.length} profesional{doctores.length !== 1 ? "es" : ""}
              </span>
            </div>
            <div className="directory-grid">
              {doctores.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
