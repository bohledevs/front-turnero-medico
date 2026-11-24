import test from "node:test";
import assert from "node:assert/strict";
import filtrosTurnosReducer, {
  cambiarFecha,
  cambiarPagina,
  limpiarFiltros,
} from "../src/store/slices/filtrosTurnosSlice.js";
import turnosReducer, {
  cambiarEstadoTurno,
  consultarDisponibilidad,
  listarTurnos,
  reservarTurno,
} from "../src/store/slices/turnosSlice.js";

test("turnos guarda la disponibilidad y conserva errores de reserva", () => {
  let state = turnosReducer(undefined, {
    type: consultarDisponibilidad.pending.type,
  });
  assert.equal(state.disponibilidadLoading, true);

  state = turnosReducer(state, {
    type: consultarDisponibilidad.fulfilled.type,
    payload: [{ fechaHoraInicio: "2030-01-01T09:00:00" }],
  });
  assert.equal(state.disponibilidadLoading, false);
  assert.equal(state.disponibilidad.length, 1);

  state = turnosReducer(state, {
    type: reservarTurno.rejected.type,
    payload: { message: "El horario ya no está disponible.", status: 409 },
  });
  assert.equal(state.reservaLoading, false);
  assert.equal(state.reservaError.status, 409);
  assert.equal(state.reservaError.message, "El horario ya no está disponible.");
});

test("turnos actualiza el listado después de cambiar el estado", () => {
  const page = {
    content: [{ id: 7, estado: "RESERVADO" }],
    totalElements: 1,
    totalPages: 1,
  };
  let state = turnosReducer(undefined, {
    type: listarTurnos.fulfilled.type,
    payload: page,
  });
  state = turnosReducer(state, {
    type: cambiarEstadoTurno.fulfilled.type,
    payload: { id: 7, estado: "CONFIRMADO" },
  });

  assert.equal(state.data.content[0].estado, "CONFIRMADO");
});

test("los filtros de turnos reinician la página sin perder el estado", () => {
  let state = filtrosTurnosReducer(undefined, cambiarPagina(3));
  state = filtrosTurnosReducer(state, cambiarFecha("2030-01-01"));
  assert.equal(state.pagina, 0);
  assert.equal(state.fecha, "2030-01-01");

  state = filtrosTurnosReducer(state, limpiarFiltros());
  assert.equal(state.fecha, "");
  assert.equal(state.estado, "");
  assert.equal(state.pagina, 0);
});
