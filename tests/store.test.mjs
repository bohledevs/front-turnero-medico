import test from "node:test";
import assert from "node:assert/strict";
import { configureStore } from "@reduxjs/toolkit";
import favoritosReducer, {
  agregarFavorito,
  quitarFavorito,
  selectEsFavorito,
  selectFavoritosPorEspecialidad,
  selectIdsFavoritos,
} from "../src/store/slices/favoritosSlice.js";
import filtrosTurnosReducer, {
  cambiarEstado,
  cambiarFecha,
  cambiarPagina,
  cambiarPeriodo,
  cambiarProfesional,
  limpiarFiltros,
  reiniciarFiltrosTurnos,
  selectFiltrosTurnos,
} from "../src/store/slices/filtrosTurnosSlice.js";

const nuevoStore = () =>
  configureStore({
    reducer: {
      favoritos: favoritosReducer,
      filtrosTurnos: filtrosTurnosReducer,
    },
  });

const doctor = (id, especialidadNombre) => ({
  id,
  nombre: "Profesional " + id,
  especialidadNombre,
});

test("filtros de turnos: cada filtro nuevo vuelve a la primera página", () => {
  const store = nuevoStore();
  store.dispatch(cambiarPagina(3));
  store.dispatch(cambiarEstado("CONFIRMADO"));
  assert.equal(selectFiltrosTurnos(store.getState()).pagina, 0);

  for (const accion of [
    cambiarFecha("2026-11-20"),
    cambiarProfesional("7"),
    cambiarPeriodo("all"),
  ]) {
    store.dispatch(cambiarPagina(2));
    store.dispatch(accion);
    assert.equal(selectFiltrosTurnos(store.getState()).pagina, 0);
  }
});

test("filtros de turnos: período, limpiar y reiniciar", () => {
  const store = nuevoStore();
  store.dispatch(cambiarFecha("2026-11-20"));
  store.dispatch(cambiarPeriodo("all"));
  // Cambiar de pestaña devuelve la fecha a "sin tocar" (null).
  assert.equal(selectFiltrosTurnos(store.getState()).fecha, null);

  store.dispatch(cambiarFecha("2026-11-20"));
  store.dispatch(cambiarEstado("RESERVADO"));
  store.dispatch(cambiarProfesional("3"));
  store.dispatch(limpiarFiltros());
  assert.deepEqual(selectFiltrosTurnos(store.getState()), {
    periodo: "all",
    fecha: "",
    estado: "",
    doctorId: "",
    pagina: 0,
  });

  store.dispatch(reiniciarFiltrosTurnos());
  assert.deepEqual(selectFiltrosTurnos(store.getState()), {
    periodo: "upcoming",
    fecha: null,
    estado: "",
    doctorId: "",
    pagina: 0,
  });
});

test("los reducers son puros: no modifican el estado recibido", () => {
  const anterior = filtrosTurnosReducer(undefined, { type: "@@init" });
  const copia = structuredClone(anterior);
  const siguiente = filtrosTurnosReducer(anterior, cambiarEstado("AUSENTE"));
  assert.deepEqual(anterior, copia);
  assert.notEqual(siguiente, anterior);
});

test("favoritos agrupados por especialidad, en orden alfabético", () => {
  const store = nuevoStore();
  store.dispatch(agregarFavorito(doctor(1, "Dermatología")));
  store.dispatch(agregarFavorito(doctor(2, "Cardiología")));
  store.dispatch(agregarFavorito(doctor(3, "Dermatología")));
  store.dispatch(agregarFavorito(doctor(4)));

  const grupos = selectFavoritosPorEspecialidad(store.getState());
  assert.deepEqual(
    grupos.map(({ especialidad, doctores }) => [
      especialidad,
      doctores.map((item) => item.id),
    ]),
    [
      ["Cardiología", [2]],
      ["Dermatología", [1, 3]],
      ["Sin especialidad", [4]],
    ],
  );
  assert.equal(selectEsFavorito(3)(store.getState()), true);
  assert.equal(selectEsFavorito(9)(store.getState()), false);
});

test("selectores memoizados: misma referencia si los favoritos no cambian", () => {
  const store = nuevoStore();
  store.dispatch(agregarFavorito(doctor(1, "Clínica médica")));
  const grupos = selectFavoritosPorEspecialidad(store.getState());
  const ids = selectIdsFavoritos(store.getState());

  // Un cambio en otro slice no recalcula: useSelector no re-renderiza.
  store.dispatch(cambiarEstado("CONFIRMADO"));
  assert.equal(selectFavoritosPorEspecialidad(store.getState()), grupos);
  assert.equal(selectIdsFavoritos(store.getState()), ids);

  // Un cambio en los favoritos sí recalcula.
  store.dispatch(quitarFavorito(1));
  assert.notEqual(selectFavoritosPorEspecialidad(store.getState()), grupos);
  assert.deepEqual(selectFavoritosPorEspecialidad(store.getState()), []);
});
