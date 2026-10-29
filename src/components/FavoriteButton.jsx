import { Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fullName } from "../lib/domain";
import {
  addFavorite,
  removeFavorite,
  selectIsFavorite,
} from "../store/slices/favoriteSlice.js";

/** Comparte la misma selección desde una tarjeta o desde el perfil profesional. */
export default function FavoriteButton({ doctor }) {
  const isFavorite = useSelector((state) => selectIsFavorite(state, doctor.id));
  const dispatch = useDispatch();

  return (
    <button
      type="button"
      className={
        "button secondary small favorite-button" +
        (isFavorite ? " selected" : "")
      }
      aria-label={"Favorito: " + fullName(doctor)}
      aria-pressed={isFavorite}
      onClick={() =>
        dispatch(isFavorite ? removeFavorite(doctor.id) : addFavorite(doctor))
      }
    >
      <Heart
        size={16}
        fill={isFavorite ? "currentColor" : "none"}
        aria-hidden="true"
      />
      {isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    </button>
  );
}
