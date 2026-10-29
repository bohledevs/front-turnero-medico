import { Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { selectEsFavorito, toggleFavorito } from "../store/slices/favoritosSlice";

// Botón de corazón de cada tarjeta de profesional.
// Se suscribe SOLO a "¿este doctor es favorito?" (true/false):
// si se agrega o quita OTRO doctor, este botón no se re-renderiza.
export default function FavoriteButton({ doctor }) {
  const esFavorito = useSelector(selectEsFavorito(doctor.id));
  const dispatch = useDispatch();

  return (
    <button
      type="button"
      className={"favorite-button" + (esFavorito ? " active" : "")}
      aria-pressed={esFavorito}
      aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
      title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
      onClick={() => dispatch(toggleFavorito(doctor))}
    >
      <Heart size={18} fill={esFavorito ? "currentColor" : "none"} />
    </button>
  );
}
