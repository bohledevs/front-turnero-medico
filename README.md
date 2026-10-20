# Turnera · frontend del Turnero Médico

Frontend React + JavaScript + Vite, basado en los ejemplos de UVA 4 y conectado a la API Spring Boot del repositorio hermano `back-turnero-medico`.

## Ejecutar todo con Docker

Requisitos: Docker Desktop iniciado y ambos repositorios en la misma carpeta. La configuración se puede generar con Node 22.12+ o con la alternativa Docker indicada abajo:

```text
Aplicaciones interactivas/
  back-turnero-medico/
  front-turnero-medico/
```

Desde esta carpeta:

```powershell
node scripts/setup.mjs
docker compose up --build -d
docker compose --profile demo run --rm demo
```

Si no tenés Node instalado, reemplazá el primer comando por:

```powershell
docker run --rm -v "${PWD}:/app" -w /app node:22-alpine node scripts/setup.mjs
```

- Interfaz: http://localhost:5173
- Backend: http://localhost:8081
- Credenciales ficticias: archivo local `demo-access.md` generado por setup.
- Paciente: `paciente@turnera.local`.
- Profesional: `medico@turnera.local`.
- Administrador: `admin@turnera.local`.

El generador no sobrescribe un .env existente. Los secretos y las credenciales no se versionan. La carga demo es opcional y crea datos persistentes a través de la API; no es un modo de respuestas falsas. Incluye tres especialidades, tres profesionales, agendas semanales, un paciente y turnos futuros. Volver a ejecutarla conserva profesionales existentes y sus agendas.

La primera construcción puede tardar por la descarga de imágenes y dependencias Java. El perfil demo espera hasta tres minutos al backend. Comprobar el arranque:

```powershell
docker compose ps
docker compose logs --tail 80 backend
```

Para detener conservando los datos:

```powershell
docker compose down
```

La base se guarda en el volumen `turnera-front_turnera_data`. Los puertos HTTP se publican solo en 127.0.0.1 y MySQL no se expone al host. Cambiá FRONTEND_PORT, BACKEND_PORT o BACKEND_PATH en .env si es necesario. Luego del primer inicio puede deshabilitarse TURNERA_BOOTSTRAP_ADMIN_ENABLED; el bootstrap no vuelve a crear administradores si ya existe uno.

## Desarrollo

```powershell
npm.cmd install
npm.cmd run dev
```

El modo predeterminado usa la API y Vite reenvía `/api` a `localhost:8081`. Para levantar la API local antes del frontend, ejecutar `docker compose up -d mysql backend`; para otro backend, establecer `API_TARGET` antes de iniciar Vite.

### Modo estático (Actividad 03)

No requiere backend, MySQL ni Docker:

```powershell
npm.cmd run dev -- --mode static
```

La aplicación conserva las mismas pantallas y lee los fixtures locales de `public/data/`. Las reservas, cambios de estado y altas se simulan en memoria y se reinician al recargar la página. Para generar una compilación estática: `npm.cmd run build -- --mode static`. Sin `--mode static`, se conserva el modo API.

Accesos ficticios exclusivos para este modo:

| Perfil | Email | Contraseña |
| --- | --- | --- |
| Paciente (id 1) | `paciente@demo.example.test` | `DemoPaciente123` |
| Médico (id 10) | `medico@demo.example.test` | `DemoMedico123` |
| Administrador (id 99) | `admin@demo.example.test` | `DemoAdmin123` |

Los fixtures contienen datos ficticios, nunca datos reales ni tokens del entorno. Sus fechas de turnos se desplazan para mantener el recorrido vigente; la disponibilidad usa las franjas horarias locales y la fecha elegida. Para ver estados vacíos, aplicar una búsqueda sin coincidencias o filtrar turnos por una fecha sin resultados. Para ver errores, intentar ingresar con una contraseña incorrecta o reservar un horario que ya no esté disponible.

## Validación

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Para compilar también la variante estática:

```powershell
npm.cmd run build -- --mode static
```

Con el entorno Docker y los datos demo cargados, ejecutar también:

```powershell
npm.cmd run verify:api
```

Esta comprobación crea y cancela una reserva ficticia. El resultado del recorrido real está en [docs/VERIFICACION.md](docs/VERIFICACION.md).

Las pruebas cubren permisos de transición, estados terminales, límites UTF-8 de contraseña, validación de franjas y fechas de Buenos Aires. La verificación integrada usa el backend y MySQL reales.

### Recorrido visual

1. Abrir la portada, buscar una especialidad y entrar en un profesional.
2. Ingresar como paciente o registrar una cuenta. Elegir una fecha futura, seleccionar horario y confirmar.
3. Ver la reserva en Mis turnos. Cancelarla con motivo y comprobar que vuelve a aparecer disponible.
4. Ingresar como profesional y seleccionar la fecha del turno en Agenda. Confirmar y marcar atendido/ausente.
5. Ingresar como administrador. Dar de alta una especialidad y un profesional; configurar su agenda semanal completa.
6. Probar una ruta directa, por ejemplo /profesionales/1, y recargar. Nginx conserva el routing SPA.
7. Reducir el ancho del navegador para revisar la versión móvil.

## Estructura

```text
src/
  components/   Controles y piezas reutilizables
  pages/        Pantallas por función
  context/      Sesión y permisos de navegación
  hooks/        Consulta y limpieza de efectos
  services/     Selección API/estático, contratos y simulación local
  lib/          Fechas y reglas de presentación
  styles.css    Diseño adaptable
docker/         Nginx y proxy de API
public/data/    Fixtures JSON ficticios alineados con los DTO
scripts/        Configuración y datos ficticios por API
tests/          Pruebas de reglas del frontend
docs/           Dominio, alcance y verificaciones
```

## Alcance y fuentes

El estudio del dominio, los contratos y las diferencias con la propuesta están en [docs/DOMINIO.md](docs/DOMINIO.md). Las funciones sin endpoint disponible se documentan allí.

Referencias de cátedra: ejemplos React-Vite, Componentes/flujo de datos, Estados locales, React Router DOM, useEffect; PDFs de UVA 4 (maquetado/routing, props, renderizado condicional y efectos). Propuesta del producto: `back-turnero-medico/docs/Propuesta de Producto.docx`.

Documentación oficial consultada: [Vite](https://vite.dev/guide/), [React Router declarativo](https://reactrouter.com/start/declarative/routing), [useEffect](https://react.dev/reference/react/useEffect).
