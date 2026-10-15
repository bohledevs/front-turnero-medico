import test from "node:test";
import assert from "node:assert/strict";
import {
  api,
  getSession,
  query,
  request,
  saveSession,
} from "../src/services/api.js";
const store = new Map();
globalThis.sessionStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, value),
  removeItem: (key) => store.delete(key),
};
globalThis.window = new EventTarget();
test("identidad de reserva, Bearer y rutas públicas", async () => {
  saveSession({ token: "test-token", expiresAt: Date.now() + 60000 });
  let sent;
  globalThis.fetch = async (path, options) => {
    sent = { path, ...options };
    return Response.json({ id: 1 }, { status: 201 });
  };
  await api.reserve({
    doctor: { id: 9 },
    fechaHoraInicio: "2030-01-01T09:00:00",
  });
  assert.equal(sent.headers.Authorization, "Bearer test-token");
  assert.equal(sent.path, "/api/turnos/reservar");
  assert.deepEqual(JSON.parse(sent.body), {
    doctor: { id: 9 },
    fechaHoraInicio: "2030-01-01T09:00:00",
  });
  await api.specialties();
  assert.equal(sent.headers.Authorization, undefined);
  assert.equal(query({ page: 0, estado: "", doctorId: null }), "page=0");
});
test("401 limpia sesión, validaciones preservan errores y abort no se oculta", async () => {
  saveSession({ token: "expired", expiresAt: Date.now() + 60000 });
  let expired = false;
  window.addEventListener(
    "turnera:expired",
    () => {
      expired = true;
    },
    { once: true },
  );
  globalThis.fetch = async () =>
    Response.json({ message: "Sesión vencida" }, { status: 401 });
  await assert.rejects(request("/turnos"), (error) => error.status === 401);
  assert.equal(getSession(), null);
  assert.equal(expired, true);
  globalThis.fetch = async () =>
    Response.json(
      { message: "Datos inválidos", fieldErrors: { dni: "DNI inválido" } },
      { status: 400 },
    );
  await assert.rejects(
    api.register({}),
    (error) => error.fieldErrors.dni === "DNI inválido",
  );
  globalThis.fetch = async () => {
    throw new DOMException("cancelled", "AbortError");
  };
  await assert.rejects(
    api.specialties(),
    (error) => error.name === "AbortError",
  );
});
