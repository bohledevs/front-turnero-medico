# Verificación del frontend

Fecha: 14 de octubre de 2026. Rama: `codex/front-scaffolding`.
Entorno: Windows, Chrome, Docker Desktop; React/Vite servido por Nginx, API Spring Boot y MySQL reales.

## Comprobaciones automáticas

| Comprobación                    | Resultado                                                       |
| ------------------------------- | --------------------------------------------------------------- |
| ESLint                          | Sin errores                                                     |
| Pruebas Node del frontend       | 7 aprobadas                                                     |
| Compilación Vite de producción  | Correcta                                                        |
| Construcción de imágenes Docker | Frontend y backend correctos                                    |
| Arranque                        | Frontend y MySQL saludables; backend responde a través de Nginx |
| Integración HTTP                | Aprobada con `npm run verify:api`                               |

Las siete pruebas cubren el cliente HTTP, Bearer, errores de validación, vencimiento por 401, cancelación de consultas, estados/permisos, contraseñas UTF-8, franjas y fechas.

La integración usa `http://localhost:5173/api`, incluyendo el proxy real de Nginx. Verificó:

- Inicio de sesión de paciente, profesional y administrador.
- Consulta pública de profesionales y disponibilidad.
- 401 sin sesión y 403 para operaciones no permitidas.
- Dos reservas simultáneas sobre el mismo horario: una responde 201 y la otra 409.
- Listados limitados al paciente y al profesional autenticados.
- Confirmación por el médico y cancelación por el paciente.
- Recuperación del horario luego de cancelar.
- Rechazo 409 al intentar reactivar un turno en estado terminal.

El script requiere las cuentas demo; crea un turno ficticio futuro y lo cancela al terminar. Conserva el registro cancelado como evidencia. Para otro puerto se admite `API_URL`.

## Comprobación visual en Chrome

| Circuito                       | Resultado observado                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| Portada y catálogo             | Especialidades y profesionales cargados desde la API; filtro por especialidad                 |
| Reserva                        | Selección de fecha/horario, confirmación y aparición en Mis turnos                            |
| Cancelación del paciente       | Motivo obligatorio, estado cancelado y horario disponible nuevamente                          |
| Sesión                         | Redirección a Mis turnos o Agenda según el perfil; cierre de sesión                           |
| Registro                       | Alta de Nicolás Demo y posterior ingreso; listado propio vacío                                |
| Agenda del médico              | Consulta por fecha, creación de sobreturno, confirmación y cancelación                        |
| Administración                 | Alta de Pediatría y Martina López; agenda de jueves de 09:00 a 12:00                          |
| Disponibilidad de agenda nueva | Seis horarios de 30 minutos visibles para Martina López                                       |
| Rutas protegidas               | Un paciente recibe una pantalla de acceso restringido al entrar en Administración             |
| Rutas directas                 | Recarga de /profesionales/4?fecha=2026-10-15 conservando el enrutamiento                      |
| Adaptación móvil               | Perfil/disponibilidad, modal de reserva y agenda semanal a 390 × 844; sin desborde horizontal |
| Escritorio                     | Portada y disponibilidad revisadas visualmente                                                |
| Consola del navegador          | Sin errores en la revisión final                                                              |

Se corrigieron durante el recorrido la redirección posterior al ingreso y el envío de fecha de nacimiento. El registro toma los valores del formulario mediante FormData, igual que los demás formularios de alta. Se ajustó el aviso de cancelación para distinguir los horarios habituales de los sobreturnos.

Las altas y reservas de esta verificación son ficticias y persisten únicamente en el volumen de demostración. La carga inicial genera tres profesionales; el recorrido administrativo agregó un cuarto.

## Evidencia

- [Portada](capturas/portada.jpg)
- [Disponibilidad generada desde una agenda real](capturas/disponibilidad.jpg)
- [Modal de reserva móvil](capturas/reserva-mobile.jpg)

## Límites de la comprobación

No se ejecutó la suite completa de pruebas Java: el Dockerfile existente compila con `-DskipTests`. Sí se ejercitó el backend real mediante HTTP y desde el navegador. No se modificó su código.

Las funciones que la propuesta menciona pero la API todavía no permite se detallan en [DOMINIO.md](DOMINIO.md). No se certifica accesibilidad completa ni compatibilidad con todos los navegadores.
