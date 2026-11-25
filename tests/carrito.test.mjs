
import test from "node:test";
import assert from "node:assert/strict";

import carritoReducer, {
  cargarCarrito,
  agregarItemCarrito,
  quitarItemCarrito,
  limpiarCarrito,
  selectCantidadCarrito,
  turnoEstaEnCarrito,
} from "../src/store/slices/carritoSlice.js";

const item = {
  id: 25,
  doctor: { id: 10 },
  fechaHoraInicio: "2030-01-10T09:00:00",
  fechaHoraFin: "2030-01-10T09:30:00",
};

const carrito = {
  id: 1,
  paciente: { id: 3 },
  items: [item],
};

test("el carrito comienza vacío", () => {
  const state = carritoReducer(undefined, {
    type: "@@INIT",
  });

  assert.equal(state.carrito, null);
  assert.equal(state.status, "idle");
  assert.equal(selectCantidadCarrito({ carrito: state }), 0);
});

test("la carga del carrito actualiza Redux", () => {
  const pending = carritoReducer(
    undefined,
    cargarCarrito.pending("carga-1", undefined),
  );

  assert.equal(pending.status, "loading");

  const fulfilled = carritoReducer(
    pending,
    cargarCarrito.fulfilled(
      carrito,
      "carga-1",
      undefined,
    ),
  );

  assert.equal(fulfilled.status, "succeeded");
  assert.equal(
    selectCantidadCarrito({ carrito: fulfilled }),
    1,
  );
  assert.deepEqual(fulfilled.carrito, carrito);
});

test("detecta un horario que ya está en el carrito", () => {
  assert.equal(
    turnoEstaEnCarrito(carrito, 10, "2030-01-10T09:00:00"),
    true,
  );

  assert.equal(
    turnoEstaEnCarrito(carrito, 10, "2030-01-10T10:00:00"),
    false,
  );

  assert.equal(
    turnoEstaEnCarrito(null, 10, "2030-01-10T09:00:00"),
    false,
  );
});

test("agregar un turno actualiza los datos", () => {
  const pending = carritoReducer(
    undefined,
    agregarItemCarrito.pending("agregar-1", {}),
  );

  const fulfilled = carritoReducer(
    pending,
    agregarItemCarrito.fulfilled(
      carrito,
      "agregar-1",
      {},
    ),
  );

  assert.equal(fulfilled.carrito.items.length, 1);
  assert.equal(fulfilled.mutationStatus, "succeeded");
});

test("quitar un turno deja el carrito vacío", () => {
  const pending = carritoReducer(
    undefined,
    quitarItemCarrito.pending("quitar-1", 25),
  );

  const fulfilled = carritoReducer(
    pending,
    quitarItemCarrito.fulfilled(
      { ...carrito, items: [] },
      "quitar-1",
      25,
    ),
  );

  assert.equal(fulfilled.carrito.items.length, 0);
  assert.equal(
    selectCantidadCarrito({ carrito: fulfilled }),
    0,
  );
});

test("limpiarCarrito elimina el estado anterior", () => {
  const pending = carritoReducer(
    undefined,
    cargarCarrito.pending("carga-2", undefined),
  );

  const loaded = carritoReducer(
    pending,
    cargarCarrito.fulfilled(
      carrito,
      "carga-2",
      undefined,
    ),
  );

  const cleared = carritoReducer(
    loaded,
    limpiarCarrito(),
  );

  assert.equal(cleared.carrito, null);
  assert.equal(cleared.status, "idle");
});
