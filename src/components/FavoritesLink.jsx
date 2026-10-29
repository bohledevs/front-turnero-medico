import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { selectFavoriteCount } from "../store/slices/favoriteSlice.js";

/** El menú se suscribe a la cantidad, sin copiar el listado a un estado local. */
export default function FavoritesLink({ onNavigate }) {
  const count = useSelector(selectFavoriteCount);

  return (
    <NavLink to="/favoritos" onClick={onNavigate}>
      Favoritos
      <span className="favorite-count" aria-live="polite" aria-atomic="true">
        {count}
      </span>
    </NavLink>
  );
}
