import test from "node:test";
import assert from "node:assert/strict";
import { createAppStore } from "../src/store/store.js";
import {
  addFavorite,
  removeFavorite,
  clearFavorites,
  selectFavorites,
  selectFavoriteCount,
  selectIsFavorite,
} from "../src/store/slices/favoriteSlice.js";

const ana = {
  id: 10,
  nombre: "Ana",
  apellido: "Pérez",
  especialidadNombre: "Clínica médica",
};
const luis = {
  id: 11,
  nombre: "Luis",
  apellido: "Gómez",
  especialidadNombre: "Cardiología",
};

test("agregar desde distintas pantallas no duplica profesionales ni modifica el estado anterior", () => {
  const store = createAppStore();
  const previous = store.getState();
  store.dispatch(addFavorite(ana));
  store.dispatch(addFavorite({ ...ana, id: "10" }));
  store.dispatch(addFavorite(luis));

  assert.deepEqual(selectFavorites(previous), []);
  assert.deepEqual(selectFavorites(store.getState()), [ana, luis]);
  assert.equal(selectFavoriteCount(store.getState()), 2);
  assert.equal(selectIsFavorite(store.getState(), "10"), true);
  assert.equal(selectIsFavorite(store.getState(), 999), false);
});

test("quitar por id conserva los otros favoritos; vaciar reinicia todos los selectores", () => {
  const store = createAppStore();
  store.dispatch(addFavorite(ana));
  store.dispatch(addFavorite(luis));
  store.dispatch(removeFavorite("10"));
  store.dispatch(removeFavorite(999));

  assert.deepEqual(selectFavorites(store.getState()), [luis]);
  assert.equal(selectIsFavorite(store.getState(), ana.id), false);
  assert.equal(selectFavoriteCount(store.getState()), 1);

  store.dispatch(clearFavorites());
  assert.deepEqual(selectFavorites(store.getState()), []);
  assert.equal(selectFavoriteCount(store.getState()), 0);
  assert.equal(selectIsFavorite(store.getState(), luis.id), false);
});

test("los stores tienen selecciones independientes y conservan el soporte Thunk de RTK", () => {
  const first = createAppStore();
  const second = createAppStore();
  first.dispatch((dispatch) => dispatch(addFavorite(ana)));

  assert.equal(selectFavoriteCount(first.getState()), 1);
  assert.equal(selectFavoriteCount(second.getState()), 0);
});
