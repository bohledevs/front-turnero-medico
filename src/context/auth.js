import { useDispatch, useSelector } from "react-redux";
import {
  cerrarSesion,
  iniciarSesion,
  selectEstadoSesion,
  selectSesionVencida,
  selectUsuario,
} from "../store/slices/authSlice";

// La sesión vive en el authSlice del store. Este hook mantiene la misma forma que tenía el
// AuthContext ({ user, login, logout, expired }) para que las pantallas no tengan que cambiar.
export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectUsuario);
  const estado = useSelector(selectEstadoSesion);
  const expired = useSelector(selectSesionVencida);
  return {
    user,
    estado,
    expired,
    // unwrap: si falla, lanza { message, status, fieldErrors } para mostrarlo en el formulario
    login: (values) => dispatch(iniciarSesion(values)).unwrap(),
    logout: () => dispatch(cerrarSesion()),
  };
}
