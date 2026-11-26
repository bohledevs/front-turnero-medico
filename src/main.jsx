import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import { restaurarSesion } from "./store/slices/authSlice";
import "./styles.css";

// Al cargar o recargar la página (F5) se recupera la sesión desde la cookie HttpOnly.
// Se despacha una sola vez, fuera de React, para que el doble montaje de StrictMode no la repita.
store.dispatch(restaurarSesion());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Provider de Redux: todos los componentes pueden acceder al store */}
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
