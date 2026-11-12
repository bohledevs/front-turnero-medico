// Los favoritos se guardan en el navegador por usuario: cada cuenta tiene su propia lista
// y quien navega sin sesión usa la lista "invitado".
const PREFIJO = "turnera.favoritos";

export function claveFavoritos(usuarioId) {
  return `${PREFIJO}.${usuarioId ?? "invitado"}`;
}

export function leerFavoritos(usuarioId) {
  try {
    const guardados = JSON.parse(localStorage.getItem(claveFavoritos(usuarioId)) || "null");
    return Array.isArray(guardados) ? guardados : [];
  } catch {
    return [];
  }
}

export function guardarFavoritos(usuarioId, items) {
  try {
    localStorage.setItem(claveFavoritos(usuarioId), JSON.stringify(items));
  } catch {
    // si el navegador bloquea el almacenamiento, la app sigue funcionando
  }
}

// Antes había una sola lista para todos los que usaban el navegador y no se puede saber
// de quién era, así que se descarta en lugar de asignársela a alguien.
export function descartarFavoritosCompartidos() {
  try {
    localStorage.removeItem(PREFIJO);
  } catch {
    // sin almacenamiento no hay nada que limpiar
  }
}
