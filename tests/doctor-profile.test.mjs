
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  staticRequest,
  resetStaticState,
} from "../src/services/staticApi.js";

const dataDirectory = new URL("../public/data/", import.meta.url);

// Simula la lectura de los JSON en modo estático.
globalThis.fetch = async (path) => {
  const file = await readFile(
    new URL(path.replace("/data/", ""), dataDirectory),
  );

  return new Response(file, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

test("los médicos de la demo tienen foto y descripción", async () => {
  const doctors = JSON.parse(
    await readFile(
      new URL("doctores.json", dataDirectory),
      "utf8",
    ),
  );

  assert.ok(doctors.length > 0);

  for (const doctor of doctors) {
    assert.equal(typeof doctor.descripcion, "string");
    assert.ok(doctor.descripcion.trim().length > 0);

    assert.equal(typeof doctor.fotoUrl, "string");
    assert.ok(doctor.fotoUrl.trim().length > 0);
  }
});

test("el listado estático devuelve foto y descripción", async () => {
  resetStaticState();

  const doctors = await staticRequest("/doctores");

  assert.ok(doctors.length > 0);

  for (const doctor of doctors) {
    assert.ok("fotoUrl" in doctor);
    assert.ok("descripcion" in doctor);
  }
});

test("el alta estática conserva foto y descripción", async () => {
  resetStaticState();

  const session = await staticRequest("/auth/login", {
    method: "POST",
    body: {
      email: "admin@demo.example.test",
      password: "DemoAdmin123",
    },
  });

  const body = {
    nombre: "Ana",
    apellido: "Prueba",
    matriculaNacional: "MN-99999",
    especialidadId: 1,
    fotoUrl: "https://example.com/ana.jpg",
    descripcion: "Profesional ficticia de prueba.",
  };

  const doctor = await staticRequest("/admin/doctores", {
    method: "POST",
    body,
    session,
  });

  assert.equal(doctor.fotoUrl, body.fotoUrl);
  assert.equal(doctor.descripcion, body.descripcion);

  const doctors = await staticRequest("/doctores");

  const created = doctors.find(
    (item) => item.id === doctor.id,
  );

  assert.ok(created);
  assert.equal(created.fotoUrl, body.fotoUrl);
  assert.equal(created.descripcion, body.descripcion);
});
