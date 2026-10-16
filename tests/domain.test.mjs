import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedTransitions,
  needsReason,
  passwordError,
  validateSchedule,
  addDays,
  asDate,
  isValidDate,
  formatTime,
} from "../src/lib/domain.js";
test("permisos y estados terminales no ofrecen acciones indebidas", () => {
  assert.deepEqual(allowedTransitions("RESERVADO", "PACIENTE"), [
    "CANCELADO_PACIENTE",
  ]);
  assert.ok(
    !allowedTransitions("CONFIRMADO", "MEDICO").includes("CANCELADO_PACIENTE"),
  );
  assert.ok(allowedTransitions("CONFIRMADO", "ADMIN").includes("ATENDIDO"));
  for (const status of [
    "ATENDIDO",
    "AUSENTE",
    "CANCELADO_MEDICO",
    "CANCELADO_PACIENTE",
  ])
    assert.deepEqual(allowedTransitions(status, "ADMIN"), []);
  assert.equal(needsReason("CONFIRMADO"), false);
  assert.equal(needsReason("AUSENTE"), true);
  assert.equal(needsReason("CANCELADO_PACIENTE"), true);
});
test("límite BCrypt cuenta bytes UTF-8", () => {
  assert.equal(passwordError("a".repeat(72)), "");
  assert.notEqual(passwordError("a".repeat(73)), "");
  assert.equal(passwordError("á".repeat(36)), "");
  assert.notEqual(passwordError("á".repeat(37)), "");
  assert.notEqual(passwordError("corta"), "");
});
test("agenda valida duración, superposiciones y límites contiguos", () => {
  const row = {
    diaSemana: "LUNES",
    horaInicio: "09:00",
    horaFin: "10:00",
    duracionTurnoMinutos: 30,
  };
  assert.equal(validateSchedule([row]), "");
  assert.equal(
    validateSchedule([row, { ...row, horaInicio: "10:00", horaFin: "11:00" }]),
    "",
  );
  assert.notEqual(
    validateSchedule([row, { ...row, horaInicio: "09:30", horaFin: "10:30" }]),
    "",
  );
  assert.notEqual(validateSchedule([{ ...row, duracionTurnoMinutos: 45 }]), "");
  assert.notEqual(validateSchedule([{ ...row, horaFin: "08:00" }]), "");
  assert.notEqual(validateSchedule([{ ...row, duracionTurnoMinutos: 0 }]), "");
  assert.equal(validateSchedule([]), "");
});
test("las fechas preservan la hora de Buenos Aires y cambian de mes correctamente", () => {
  assert.equal(
    asDate("2030-01-01T09:30:00").toISOString(),
    "2030-01-01T12:30:00.000Z",
  );
  assert.equal(formatTime("2030-01-01T09:30:00"), "09:30");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2030-12-31", 1), "2031-01-01");
});

test("fechas de la URL rechazan valores inexistentes", () => {
  assert.equal(isValidDate("2028-02-29"), true);
  for (const value of [
    "2027-02-29",
    "2026-13-01",
    "2026-02-31",
    "ayer",
    "",
    null,
  ]) {
    assert.equal(isValidDate(value), false);
  }
});
