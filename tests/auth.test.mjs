import test from "node:test";
import assert from "node:assert/strict";
import { AxiosError } from "axios";
import { configureStore } from "@reduxjs/toolkit";

import { axiosClient } from "../src/services/api.js";
import authReducer, {
  cerrarSesion,
  iniciarSesion,
  restaurarSesion,
  selectEstadoSesion,
  selectSesionVencida,
  selectUsuario,
  sesionVencida,
} from "../src/store/slices/authSlice.js";

// sessionStorage en memoria: el front no debería escribir nada con el backend real.
const almacenamiento = new Map();
globalThis.sessionStorage = {
  getItem: (clave) => almacenamiento.get(clave) ?? null,
  setItem: (clave, valor) => almacenamiento.set(clave, valor),
  removeItem: (clave) => almacenamiento.delete(clave),
};
globalThis.window = new EventTarget();

const USUARIO = {
  id: 7,
  nombre: "Ana",
  apellido: "Paciente",
  email: "ana@turnera.test",
  rol: "PACIENTE",
  expiresIn: 3600,
};

const nuevoStore = () => configureStore({ reducer: { auth: authReducer } });

// Responde según la ruta, sin conectarse al backend. Guarda los pedidos para revisarlos.
function backend(respuestas) {
  const pedidos = [];
  axiosClient.defaults.adapter = async (config) => {
    pedidos.push({ url: config.url, method: config.method });
    const [status, data] = respuestas[config.url] ?? [404, { message: "No existe" }];
    const response = { data, status, statusText: "", headers: {}, config };
    if (status >= 400) {
      throw new AxiosError(data.message, AxiosError.ERR_BAD_RESPONSE, config, null, response);
    }
    return response;
  };
  return pedidos;
}

const adapterOriginal = axiosClient.defaults.adapter;
test.afterEach(() => {
  axiosClient.defaults.adapter = adapterOriginal;
  almacenamiento.clear();
});

test("al recargar arranca verificando y restaura la sesión desde /auth/me", async () => {
  const store = nuevoStore();
  assert.equal(selectEstadoSesion(store.getState()), "verificando");
  assert.equal(selectUsuario(store.getState()), null);

  backend({ "/auth/me": [200, USUARIO] });
  await store.dispatch(restaurarSesion());

  const usuario = selectUsuario(store.getState());
  assert.equal(selectEstadoSesion(store.getState()), "autenticado");
  assert.equal(usuario.id, 7);
  assert.equal(usuario.rol, "PACIENTE");
  assert.ok(Math.abs(usuario.expiresAt - (Date.now() + 3600 * 1000)) < 5000);
});

test("sin cookie de sesión (/auth/me responde 401) queda anónima y no avisa vencimiento", async () => {
  const store = nuevoStore();
  let avisoVencida = false;
  window.addEventListener("turnera:expired", () => (avisoVencida = true), { once: true });

  backend({ "/auth/me": [401, { message: "Se requiere un token Bearer válido" }] });
  await store.dispatch(restaurarSesion());

  assert.equal(selectEstadoSesion(store.getState()), "anonimo");
  assert.equal(selectUsuario(store.getState()), null);
  assert.equal(selectSesionVencida(store.getState()), false);
  assert.equal(avisoVencida, false);
});

test("iniciar sesión guarda el usuario sin el token y no escribe en el navegador", async () => {
  const store = nuevoStore();
  backend({ "/auth/login": [200, { ...USUARIO, token: "jwt-secreto", tokenType: "Bearer" }] });

  await store.dispatch(iniciarSesion({ email: USUARIO.email, password: "x" })).unwrap();

  const estado = store.getState().auth;
  assert.equal(estado.estado, "autenticado");
  assert.equal(estado.usuario.email, USUARIO.email);
  assert.equal(JSON.stringify(estado).includes("jwt-secreto"), false);
  assert.equal(almacenamiento.size, 0);
});

test("un login rechazado devuelve el mensaje y los errores de campo", async () => {
  const store = nuevoStore();
  backend({
    "/auth/login": [400, { message: "Revisá los datos", fieldErrors: { email: "Email inválido" } }],
  });

  await assert.rejects(
    store.dispatch(iniciarSesion({ email: "x", password: "y" })).unwrap(),
    (error) =>
      error.status === 400 &&
      error.message === "Revisá los datos" &&
      error.fieldErrors.email === "Email inválido",
  );
  assert.equal(selectUsuario(store.getState()), null);
});

test("vencimiento y cierre de sesión", async () => {
  const store = nuevoStore();
  const pedidos = backend({ "/auth/login": [200, USUARIO], "/auth/logout": [204, null] });
  await store.dispatch(iniciarSesion({ email: USUARIO.email, password: "x" }));

  store.dispatch(sesionVencida());
  assert.equal(selectUsuario(store.getState()), null);
  assert.equal(selectSesionVencida(store.getState()), true);

  await store.dispatch(iniciarSesion({ email: USUARIO.email, password: "x" }));
  assert.equal(selectSesionVencida(store.getState()), false);

  await store.dispatch(cerrarSesion());
  assert.equal(selectEstadoSesion(store.getState()), "anonimo");
  assert.equal(selectUsuario(store.getState()), null);
  // El backend tiene que borrar la cookie: el front no puede, es HttpOnly.
  assert.deepEqual(pedidos.at(-1), { url: "/auth/logout", method: "post" });
});

test("cerrar sesión no falla si el backend no responde", async () => {
  const store = nuevoStore();
  backend({ "/auth/login": [200, USUARIO], "/auth/logout": [503, { message: "Caído" }] });
  await store.dispatch(iniciarSesion({ email: USUARIO.email, password: "x" }));

  await store.dispatch(cerrarSesion());
  assert.equal(selectUsuario(store.getState()), null);
});
