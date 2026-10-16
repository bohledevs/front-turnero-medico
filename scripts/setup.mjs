import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
if (existsSync(".env")) {
  console.log(".env ya existe; se conserva su configuración.");
  process.exit(0);
}
const password = "Turnera-" + randomBytes(6).toString("hex") + "!";
const env =
  [
    "BACKEND_PATH=../back-turnero-medico",
    "FRONTEND_PORT=5173",
    "BACKEND_PORT=8081",
    "MYSQL_PASSWORD=" + randomBytes(24).toString("hex"),
    "MYSQL_ROOT_PASSWORD=" + randomBytes(24).toString("hex"),
    "JWT_SECRET=" + randomBytes(32).toString("base64"),
    "DEMO_PASSWORD=" + password,
  ].join("\n") + "\n";
writeFileSync(".env", env, { flag: "wx", mode: 0o600 });
writeFileSync(
  "demo-access.md",
  "# Acceso al entorno local de demostración\n\nURL: http://localhost:5173\n\nContraseña para las tres cuentas: " +
    password +
    "\n\n- Paciente: paciente@turnera.local\n- Profesional: medico@turnera.local\n- Administración: admin@turnera.local\n\nSon datos ficticios persistidos en la base local. El perfil demo se ejecuta explícitamente.\n",
  { mode: 0o600 },
);
console.log(
  "Configuración generada. Las cuentas y la contraseña están en demo-access.md.",
);
