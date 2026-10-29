# UVA 5: favoritos de profesionales con Redux Toolkit

## Consigna implementada

La imagen solicita un slice del TPO con Redux Toolkit y componentes que usen sus acciones y estén suscritos a sus estados. Se eligieron favoritos de profesionales, siguiendo el ejemplo `favoriteSlice.js` de la cátedra.

## Archivos y responsabilidades

| Archivo                             | Función                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/store/slices/favoriteSlice.js` | Estado inicial `{ items: [] }`, reducers, acciones y selectores.                              |
| `src/store/store.js`                | `configureStore` registra el reducer como `favorites`; conserva Thunk y los controles de RTK. |
| `src/main.jsx`                      | `Provider` pone el store a disposición de toda la aplicación.                                 |
| `src/components/FavoriteButton.jsx` | `useSelector` lee si ese profesional está seleccionado; `useDispatch` agrega o quita.         |
| `src/components/FavoritesLink.jsx`  | Se suscribe a la cantidad y actualiza el contador del menú.                                   |
| `src/pages/Favorites.jsx`           | Se suscribe al listado, muestra las tarjetas y permite vaciarlo.                              |
| `src/components/DoctorCard.jsx`     | Reutiliza el botón en la portada, el directorio y los favoritos.                              |
| `src/pages/ProfessionalDetail.jsx`  | Reutiliza el botón en el perfil.                                                              |
| `src/context/AuthProvider.jsx`      | Despacha el vaciado al ingresar, salir o vencer la sesión.                                    |

## Acciones y flujo

- `addFavorite(doctor)`: agrega el DTO del profesional sin duplicarlo por id.
- `removeFavorite(id)`: quita ese profesional; acepta id numérico o textual.
- `clearFavorites()`: vacía la selección.
- `selectFavorites`, `selectFavoriteCount` y `selectIsFavorite`: leen listado, cantidad y selección individual.

Clic en el botón → `dispatch(addFavorite(doctor))` → reducer del slice → nuevo estado del store → se actualizan los componentes cuyo selector cambió. No se copia el listado ni la cantidad a `useState`. La cantidad se deriva del listado para evitar inconsistencias.

Los reducers solo calculan estado. La escritura sobre `state` dentro de `createSlice` usa Immer, que produce el resultado inmutable. No se escribe en el store desde afuera de las acciones.

## Alcance

Los favoritos viven en memoria: se conservan al navegar entre rutas y se reinician al recargar la página o al ingresar, cerrar o vencer una sesión. La pantalla lo informa. No se guardan por cuenta ni entre dispositivos.

Este slice usa operaciones síncronas, como el ejemplo de favoritos de clase. No necesita peticiones HTTP. Los apartados de Axios y `createAsyncThunk` de la UVA explican operaciones asíncronas y la otra actividad de integración completa; esa refactorización no forma parte de la consigna de la imagen. Las consultas y reservas existentes conservan el servicio API/estático y la autenticación actuales.

El guardado no confirma disponibilidad: el enlace al perfil vuelve a consultar los horarios. La función sirve en modo API y estático.

## Correspondencia con el material

Se revisaron los ocho PDF de la carpeta UVA 5 (26 páginas), los apuntes de texto, los diagramas y los ejemplos de Context/Redux del código entregado. Se comprobó que el ZIP coincide con la carpeta descomprimida.

- `Nota_UVA5_Mod1_01.pdf`: store, acciones, reducers, selectores y flujo unidireccional.
- `Nota_UVA5_Mod1_03.pdf`: middleware Thunk incluido por defecto y reducers sin efectos secundarios.
- `Nota_UVA5_Mod1_04.pdf`: Provider, configureStore, useSelector y useDispatch.
- `Nota_UVA5_Mod2_01.pdf`: un slice también puede manejar operaciones síncronas.
- `Nota_UVA5_Mod2_02.pdf`: createSlice, Immer y organización por dominio.
- `useContext, Redux y Redux Toolkit.pdf`: suscripciones a partes concretas del estado.
- Claves de autocorrección y ejercicio grupal: organización, configuración global y separación de operaciones asíncronas.
- `PasosCrearCounterProvider.txt`, `ParaQueSirveCadaArchivo.txt`, `ResumenConceptosSlice.txt` y `SuscripcionComponentesAEstadosDeUnSllice.txt`: estructura y conexión de componentes.
- Ejemplos `store/store.js`, `store/slices/favoriteSlice.js`, `Counter.jsx`, `CartRedux.jsx` y `ProductDetailRedux.jsx`: patrón aplicado al dominio Turnero.

Referencia complementaria: [inicio de Redux Toolkit](https://redux-toolkit.js.org/tutorials/quick-start) y [hooks de React Redux](https://redux.js.org/react-redux/api/hooks).

## Comprobación

Ejecutar `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build` y `npm.cmd run build -- --mode static`.

Recorrido con `npm.cmd run dev -- --mode static`:

1. En Profesionales, agregar dos profesionales y comprobar el contador del menú.
2. Entrar al perfil de uno: el botón debe estar marcado.
3. Abrir Favoritos: deben aparecer ambos; quitar uno y comprobar el contador.
4. Volver al directorio: la selección debe coincidir.
5. Vaciar favoritos y comprobar el estado vacío y el contador en cero.
6. Agregar uno y recargar: la selección se reinicia.
7. Ingresar, agregar uno y cerrar sesión: la selección se reinicia.
8. Repetir el recorrido en una pantalla angosta y con teclado.

## Resultado de la validación local

- Revisión ESLint: sin errores.
- Suite del repositorio: 11 pruebas aprobadas, incluidas tres nuevas de favoritos.
- Compilaciones API y estática: aprobadas.
- Comprobación adicional de los componentes reales con DOM emulado y fixtures: seis escenarios aprobados (tarjetas/contador, perfil, listado/vaciado, ingreso/salida, vencimiento y nueva carga), sin errores de ejecución.
- La comprobación de componentes no verifica el diseño visual. El navegador no pudo acceder al servidor local, por lo que queda pendiente ese recorrido visual.
