import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";
import "./styles.css";
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
