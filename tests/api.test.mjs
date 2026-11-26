
import test from "node:test";
import assert from "node:assert/strict";
import { AxiosError } from "axios";

import {
  api,
  axiosClient,
  getDataMode,
  getSession,
  query,
  request,
  saveSession,
  setDataMode,
} from "../src/services/api.js";

// Simulación del almacenamiento de sesiones.
const store = new Map();

globalThis.sessionStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
};

globalThis.window = new EventTarget();

/*
 * Simula una respuesta correcta de Axios sin
 * realizar conexiones al backend real.
 */
function mockResponse(config, data, status = 200) {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config,
  };
}

/*
 * Simula un error HTTP de Axios.
 */
function mockError(config, status, data) {
  const response = {
    data,
    status,
    statusText: "Error",
    headers: {},
    config,
  };

  return Promise.reject(
    new AxiosError(
      data?.message || "Error HTTP",
      AxiosError.ERR_BAD_RESPONSE,
      config,
      null,
      response,
    ),
  );
}

/*
 * TEST 1
 * Comprueba:
 * - Base URL de Axios.
 * - Identidad de la reserva.
 * - La sesión viaja en la cookie: nunca se manda un header Bearer.
 * - Configuración del token CSRF (cookie XSRF-TOKEN -> header X-XSRF-TOKEN).
 * - Generación de parámetros de búsqueda.
 */
test("identidad de reserva, sesión por cookie y token CSRF", async () => {
  const originalAdapter = axiosClient.defaults.adapter;

  let sent;

  axiosClient.defaults.adapter = async (config) => {
    sent = config;
    return mockResponse(config, { id: 1 }, 201);
  };

  try {
    await api.reserve({
      doctor: { id: 9 },
      fechaHoraInicio: "2030-01-01T09:00:00",
    });

    assert.equal(sent.baseURL, "/api");
    assert.equal(sent.url, "/turnos/reservar");
    assert.equal(sent.method, "post");

    assert.equal(sent.headers.get("Authorization"), undefined);
    assert.equal(sent.withCredentials, true);
    assert.equal(sent.xsrfCookieName, "XSRF-TOKEN");
    assert.equal(sent.xsrfHeaderName, "X-XSRF-TOKEN");

    assert.deepEqual(JSON.parse(sent.data), {
      doctor: { id: 9 },
      fechaHoraInicio: "2030-01-01T09:00:00",
    });

    await api.specialties();

    assert.equal(sent.url, "/especialidades");

    assert.equal(
      sent.headers.get("Authorization"),
      undefined,
    );

    assert.equal(
      query({
        page: 0,
        estado: "",
        doctorId: null,
      }),
      "page=0",
    );
  } finally {
    axiosClient.defaults.adapter = originalAdapter;
    saveSession(null);
  }
});

/*
 * TEST 2
 * Comprueba:
 * - HTTP 401 avisa que la sesión venció.
 * - Se notifica la sesión vencida.
 * - Los errores 400 conservan fieldErrors.
 * - El login público no dispara sesión vencida.
 * - Las cancelaciones conservan AbortError.
 */
test("401 limpia sesión, validaciones preservan errores y abort no se oculta", async () => {
  const originalAdapter = axiosClient.defaults.adapter;

  let expired = false;

  window.addEventListener(
    "turnera:expired",
    () => {
      expired = true;
    },
    { once: true },
  );

  try {
    // Simular HTTP 401 en una ruta protegida.
    axiosClient.defaults.adapter = (config) =>
      mockError(config, 401, {
        message: "Sesión vencida",
      });

    await assert.rejects(
      request("/turnos"),
      (error) => error.status === 401,
    );

    assert.equal(expired, true);

    // Simular error de validación HTTP 400.
    axiosClient.defaults.adapter = (config) =>
      mockError(config, 400, {
        message: "Datos inválidos",
        fieldErrors: {
          dni: "DNI inválido",
        },
      });

    await assert.rejects(
      api.register({}),
      (error) =>
        error.status === 400 &&
        error.fieldErrors.dni === "DNI inválido",
    );

    // Un 401 de login o de /auth/me no debe avisar que una sesión venció.
    let loginExpired = false;

    const listener = () => {
      loginExpired = true;
    };

    window.addEventListener("turnera:expired", listener);

    try {
      axiosClient.defaults.adapter = (config) =>
        mockError(config, 401, {
          message: "Credenciales inválidas",
        });

      await assert.rejects(
        api.login({
          username: "incorrecto",
          password: "incorrecta",
        }),
        (error) => error.status === 401,
      );

      await assert.rejects(api.me(), (error) => error.status === 401);

      assert.equal(loginExpired, false);
    } finally {
      window.removeEventListener(
        "turnera:expired",
        listener,
      );
    }

    // Simular una solicitud cancelada.
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
      api.specialties(controller.signal),
      (error) => error.name === "AbortError",
    );
  } finally {
    axiosClient.defaults.adapter = originalAdapter;
    saveSession(null);
  }
});

/*
 * TEST 3
 * Conservamos el comportamiento original:
 * - Persistencia de la fuente de datos.
 * - Cierre de sesión al cambiar de fuente.
 * - Validación de valores permitidos.
 */
test("la fuente de datos elegida se persiste y cierra la sesión", () => {
  const local = new Map();

  globalThis.localStorage = {
    getItem: (key) => local.get(key) ?? null,
    setItem: (key, value) => local.set(key, value),
    removeItem: (key) => local.delete(key),
  };

  try {
    saveSession({
      token: "t",
      expiresAt: Date.now() + 60000,
    });

    let logout = false;

    window.addEventListener(
      "turnera:logout",
      () => {
        logout = true;
      },
      { once: true },
    );

    setDataMode("static");

    assert.equal(getDataMode(), "static");
    assert.equal(getSession(), null);
    assert.ok(logout);

    setDataMode("otro");
    assert.equal(getDataMode(), "static");

    setDataMode("api");
    assert.equal(getDataMode(), "api");
  } finally {
    delete globalThis.localStorage;
  }
});

/*
 * TEST 4
 * Comprueba:
 * - El login devuelve los datos del usuario sin el token.
 * - Con el backend real no se guarda nada de la sesión en el navegador.
 */
test("el login no expone ni guarda el token con el backend real", async () => {
  const originalAdapter = axiosClient.defaults.adapter;
  store.clear();

  axiosClient.defaults.adapter = async (config) =>
    mockResponse(config, {
      id: 7,
      nombre: "Ana",
      apellido: "Paciente",
      email: "ana@turnera.test",
      rol: "PACIENTE",
      token: "jwt-que-no-debe-quedar-en-el-navegador",
      tokenType: "Bearer",
      expiresIn: 3600,
    });

  try {
    const usuario = await api.login({ email: "ana@turnera.test", password: "x" });

    assert.equal(usuario.id, 7);
    assert.equal(usuario.token, undefined);
    assert.equal(usuario.tokenType, undefined);
    assert.equal(getSession(), null);
    assert.equal(store.size, 0);
  } finally {
    axiosClient.defaults.adapter = originalAdapter;
  }
});
