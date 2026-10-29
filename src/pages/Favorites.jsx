import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import DoctorCard from "../components/DoctorCard";
import PageHeading from "../components/PageHeading";
import { EmptyState } from "../components/Feedback";
import { selectFavoritos, vaciarFavoritos } from "../store/slices/favoritosSlice";

// Página "Mis favoritos": se suscribe a la lista completa de favoritos.
export default function Favorites() {
  const favoritos = useSelector(selectFavoritos);
  const dispatch = useDispatch();

  return (
    <div className="container page">
      <PageHeading
        eyebrow="TUS PROFESIONALES"
        title="Mis favoritos"
        description="Los profesionales que guardaste para encontrarlos rápido."
        action={
          favoritos.length > 0 && (
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
      {favoritos.length === 0 ? (
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
        <div className="directory-grid">
          {favoritos.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
