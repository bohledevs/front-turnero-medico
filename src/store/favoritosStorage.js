// Los favoritos se guardan en el navegador por usuario: cada cuenta tiene su propia lista
// y quien navega sin sesión usa la lista "invitado".
const PREFIJO = "turnera.favoritos";

// Dueño de la lista: rol + id. El id solo no alcanza porque pacientes, médicos y administradores
// están en tablas distintas del backend y pueden repetir id (paciente 1 y médico 1).
export function duenioFavoritos(usuario) {
  return usuario ? `${usuario.rol}-${usuario.id}`.toLowerCase() : null;
}

export function claveFavoritos(duenio) {
  return `${PREFIJO}.${duenio ?? "invitado"}`;
}

export function leerFavoritos(duenio) {
  try {
    const guardados = JSON.parse(localStorage.getItem(claveFavoritos(duenio)) || "null");
    return Array.isArray(guardados) ? guardados : [];
  } catch {
    return [];
  }
}

export function guardarFavoritos(duenio, items) {
  try {
    localStorage.setItem(claveFavoritos(duenio), JSON.stringify(items));
  } catch {
    // si el navegador bloquea el almacenamiento, la app sigue funcionando
  }
}

// Se descartan las listas de las que no se puede saber el dueño: la vieja compartida por todos
// ("turnera.favoritos") y las guardadas solo por id ("turnera.favoritos.1"), que podían mezclar
// a un paciente y un médico con el mismo id.
export function descartarFavoritosCompartidos() {
  try {
    const viejas = [];
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);
      if (clave === PREFIJO || /^turnera\.favoritos\.\d+$/.test(clave)) viejas.push(clave);
    }
    viejas.forEach((clave) => localStorage.removeItem(clave));
  } catch {
    // sin almacenamiento no hay nada que limpiar
  }
}
