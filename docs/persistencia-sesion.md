# Persistencia de la sesión al recargar (F5)

## Problema

Al recargar la página, el store de Redux arranca vacío y el `authSlice` pierde al usuario. Hay que recuperar la sesión sin pedirle que vuelva a ingresar.

## Opciones analizadas

| Opción | Cómo persiste | Ataque principal | Qué pasa si hay XSS |
| --- | --- | --- | --- |
| `localStorage` | El token en el navegador, sin vencimiento | XSS | Un script inyectado lee el token, se lo lleva y lo usa desde cualquier lado hasta que venza. |
| `redux-persist` | Guarda el slice en `localStorage` | XSS | Lo mismo: por debajo es `localStorage`. Suma una dependencia sin sumar seguridad. |
| **Cookie HttpOnly** (elegida) | El backend guarda el JWT en una cookie que el JavaScript no puede leer | CSRF | El script no puede leer el token. Solo podría actuar mientras la página esté abierta, y eso se limita con las medidas de abajo. |

## Decisión

Cookie **HttpOnly** emitida por el backend en el login. El `authSlice` guarda solo los datos del usuario (`id`, `nombre`, `apellido`, `email`, `rol`, `expiresAt`), nunca el token.

Al recargar:

1. `main.jsx` despacha `restaurarSesion()` una sola vez.
2. El thunk llama a `GET /api/auth/me`; el navegador manda la cookie solo.
3. Si responde `200`, el slice queda `autenticado` con el usuario. Si responde `401`, queda `anonimo`.
4. Mientras está `verificando`, `ProtectedRoute` muestra "Recuperando tu sesión…" en lugar de mandar al login.

El front y el backend son el mismo origen: el navegador llama a `/api` y el proxy (Vite en desarrollo, nginx en Docker) lo pasa al backend. Por eso no hace falta CORS con credenciales.

## Cómo se mitiga cada ataque

### XSS (robo del token)

- La cookie `turnera_sesion` es `HttpOnly`: no aparece en `document.cookie`.
- Ni el store, ni `sessionStorage`, ni `localStorage` guardan el token. `api.login` lo descarta del cuerpo y `/api/auth/me` no lo devuelve.
- React escapa el contenido por defecto y el proyecto no usa `dangerouslySetInnerHTML`.

### CSRF (otro sitio usa la cookie)

- `SameSite=Strict`: el navegador no envía la cookie en pedidos que salen de otro sitio.
- Token CSRF de doble envío: el backend deja la cookie `XSRF-TOKEN` (legible) y exige que vuelva en el header `X-XSRF-TOKEN` en `POST`, `PUT`, `PATCH` y `DELETE`. Axios lo hace solo (`xsrfCookieName` / `xsrfHeaderName` en `src/services/api.js`). Otro sitio no puede leer esa cookie, así que no puede armar el header.
- Login y registro solo aceptan JSON, que otro sitio no puede mandar sin pasar por CORS.

### Token interceptado o eterno

- `Secure`: la cookie solo viaja por HTTPS (los navegadores la aceptan también en `http://localhost`).
- `Path=/api` y `Max-Age` igual al vencimiento del JWT. Además, el front cierra la sesión al cumplirse `expiresAt` o cuando la API responde `401`.
- Cerrar sesión llama a `POST /api/auth/logout`, que borra la cookie. El front no puede borrarla porque es HttpOnly.

## Modo demo

El modo estático no tiene backend, así que no hay cookie. Ahí se simula la sesión en `sessionStorage` con un token ficticio de `cuentas-demo.json`. No es un riesgo porque no hay datos ni credenciales reales.

## Archivos

- `src/store/slices/authSlice.js`: estado de la sesión y thunks `iniciarSesion`, `restaurarSesion`, `cerrarSesion`.
- `src/context/auth.js`: hook `useAuth`, con la misma forma que tenía el contexto.
- `src/context/AuthProvider.jsx`: efectos (vencimiento, eventos de la API, reinicio de filtros).
- `src/services/api.js`: Axios con cookie y token CSRF.
- Backend: `SesionCookie`, `JwtFilter`, `SecurityConfig` (CSRF) y `AuthController` (`/me`, `/logout`).
