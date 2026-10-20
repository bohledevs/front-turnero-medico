# Dominio y decisiones del frontend

Estudio previo: propuesta de producto en `back-turnero-medico/docs/Propuesta de Producto.docx`, README, controladores, DTO, seguridad y servicios del backend local (commit `c9acbfa`).

## Actores y circuito

- Paciente: alta pública, inicio de sesión, filtro de profesionales, consulta de disponibilidad, reserva propia, consulta e historial, cancelación con motivo.
- Profesional (MEDICO): agenda propia, confirmación, atención, ausencia, cancelación y sobreturno justificado.
- Administrador: agenda global, alta de especialidades y profesionales, reemplazo de horarios semanales y operaciones sobre turnos.

El backend determina la identidad desde el JWT. La reserva envía exclusivamente doctor e inicio; no envía paciente, estado ni duración. La disponibilidad es calculada desde HorarioAtencion: su id puede ser null. Cada botón se identifica por fechaHoraInicio, no por id.

RESERVADO permite CONFIRMADO o cancelación. CONFIRMADO permite ATENDIDO, AUSENTE o cancelación. Los estados finales no ofrecen acciones. PACIENTE solo cancela como CANCELADO_PACIENTE; MEDICO no puede usar esa transición. Ausencias y cancelaciones requieren motivo.

Todos los horarios se interpretan en America/Argentina/Buenos_Aires. Los LocalDateTime sin zona se conservan como hora local del consultorio, sin convertirlos con toISOString al enviar reservas.

## Modo estático

`npm run dev -- --mode static` selecciona un adaptador local en `src/services/staticApi.js`; todas las pantallas siguen consumiendo las funciones de `src/services/api.js`. El adaptador carga `public/data/` y simula autenticación, registro, reservas, transiciones, sobreturnos y operaciones administrativas en memoria. Al recargar se restauran los fixtures iniciales. La opción predeterminada continúa siendo la API real.

Los archivos de especialidades, profesionales, disponibilidad, pacientes y turnos contienen los campos y anidamientos de sus DTO backend. `turnos.json` es una respuesta paginada con `content`, `pageable`, `sort` y metadatos; el adaptador aplica los filtros/paginación solicitados y devuelve la misma estructura. `cuentas-demo.json` es un archivo de soporte del modo local: sus perfiles de respuesta siguen `LoginResponse` y sus contraseñas/tokens son ficticios. No se incluyen datos de personas reales, tokens del entorno ni secretos.

Los turnos parten de la fecha de referencia `2026-10-19`; el adaptador los desplaza para mantenerlos demostrables en el presente. Las franjas disponibles contienen fechas representativas de los días semanales configurados; el adaptador solo ofrece una franja cuando coincide el día de semana de la fecha consultada, trasladándola a esa fecha. El `id` de disponibilidad es `null`, como en la respuesta calculada por el backend. Los valores conservan el formato `LocalDateTime` (hora local de Buenos Aires, sin zona).

## Contrato implementado

| Pantalla                       | Operaciones reales                                                 |
| ------------------------------ | ------------------------------------------------------------------ |
| Ingresar / registro            | POST /api/auth/login, POST /api/auth/register                      |
| Profesionales                  | GET /api/doctores?nombre=&especialidadId=, GET /api/especialidades |
| Profesional /profesionales/:id | catálogo + GET /api/turnos/disponibles?doctorId=&fecha=            |
| Reserva                        | POST /api/turnos/reservar                                          |
| Mis turnos / agenda            | GET /api/turnos con filtros, sort y paginación                     |
| Cambios de estado              | PATCH /api/turnos/:id/estado                                       |
| Sobreturno                     | POST /api/turnos/sobreturno                                        |
| Administración                 | POST /api/admin/especialidades, POST /api/admin/doctores           |
| Agenda semanal                 | PUT /api/admin/doctores/:id/horarios                               |

Después de un conflicto de reserva se vuelve a consultar disponibilidad. Después de una cancelación se recarga el listado; la próxima consulta de horarios vuelve a pedir datos al servidor. No hay horarios, profesionales ni reservas simulados dentro de React.

## Diferencias entre propuesta y backend disponible

La propuesta describe un objetivo más amplio que el código implementado. Se respeta el contrato real (/api, sin /v1).

- No hay endpoints para editar/desactivar profesionales ni especialidades.
- No hay bloqueos excepcionales, reprogramación atómica, modificación de datos personales ni recuperación de contraseña.
- No hay lectura de la plantilla semanal ni edición de agenda por MEDICO. Solo ADMIN puede reemplazarla completa. La pantalla informa este efecto y exige confirmación explícita.
- No hay búsqueda/listado de pacientes ni nombres de pacientes en TurnoResponse: la agenda identifica al paciente por su número. El formulario de sobreturno solicita ese número.
- El backend no aplica antelación mínima al cancelar ni restringe ATENDIDO/AUSENTE a turnos ya transcurridos. El frontend reproduce las transiciones reales; las políticas propuestas requerirían ampliación del servidor.
- No hay API de estadísticas, notificaciones ni historial de cambios por turno. No se muestran indicadores inventados.
- Obra social y afiliado son opcionales en el DTO, pero están fuera del alcance funcional de la propuesta: el alta solicita identidad, contacto y fecha de nacimiento.

Estas diferencias son pendientes del backend, no funciones simuladas. No se modificó el repositorio backend.

## Correspondencia con UVA 4

Se estudiaron los ejemplos descomprimidos React-Vite, Componentes/flujo de datos, Estados locales, React Router DOM y useEffect; también la clave de maquetado/routing y las notas del módulo 2.

| Contenido de cátedra                 | Evidencia                                             |
| ------------------------------------ | ----------------------------------------------------- |
| React + Vite, JavaScript y JSX       | package.json, vite.config.js, main.jsx                |
| Componentes funcionales y props      | DoctorCard, Field, Modal, PageHeading                 |
| Composición y children               | Layout, AuthProvider, Modal, Alert                    |
| useState y estado inmutable          | filtros, formularios, selección de horario, agenda    |
| BrowserRouter, Routes, Route         | main.jsx y App.jsx                                    |
| Link/NavLink, navegación sin recarga | Layout y enlaces internos                             |
| Ruta dinámica y useParams            | /profesionales/:id                                    |
| useEffect con limpieza               | useResource (AbortController), sesión y foco de modal |
| Renderizado condicional y listas     | carga, vacío, error, roles y resultados               |
| Organización                         | components, pages, hooks, services, context, lib      |

No se suministró una maqueta Figma. Se creó una propuesta visual propia; no se afirma correspondencia con un diseño Figma aprobado.

## Decisiones de implementación

React Router declarativo y estado local, sin Redux ni framework de UI. fetch centralizado para JWT y errores fieldErrors. JWT guardado en sessionStorage para conservar sesión al recargar dentro de la pestaña, con vencimiento y cierre por 401. La autorización definitiva sigue en Spring Security. En un despliegue público corresponde evaluar cookies HttpOnly/BFF, HTTPS y política CSP.

Nginx sirve la SPA y redirige /api al backend en la misma red Docker: el navegador usa un único origen. El entorno Docker tiene base y volumen propios; no reutiliza la base del backend ya existente. Las cuentas de demostración son ficticias y se cargan por API mediante un perfil explícito.
