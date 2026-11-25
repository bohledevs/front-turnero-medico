
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import {
  cargarCarrito,
  quitarItemCarrito,
} from "../store/slices/carritoSlice.js";

import {
  formatDate,
  formatTime,
} from "../lib/domain.js";

import {
  Alert,
  EmptyState,
  Loading,
  ResourceError,
} from "../components/Feedback.jsx";

export default function Cart() {
  const dispatch = useDispatch();
  const [quitandoId, setQuitandoId] = useState(null);

  const {
    carrito,
    status,
    error,
    mutationStatus,
    mutationError,
  } = useSelector((state) => state.carrito);

  const items = carrito?.items ?? [];

  // Eliminar un ítem y recibir el carrito actualizado.
  async function quitarTurno(itemId) {
    setQuitandoId(itemId);

    try {
      await dispatch(quitarItemCarrito(itemId)).unwrap();
    } catch {
      // El mensaje queda guardado en mutationError.
    } finally {
      setQuitandoId(null);
    }
  }

  function reintentar() {
    dispatch(cargarCarrito());
  }

  return (
    <div className="container page cart-page">
      <Link to="/profesionales" className="back-link">
        <ArrowLeft size={17} />
        Volver a profesionales
      </Link>

      <header className="cart-heading">
        <div>
          <span className="eyebrow">TUS PRÓXIMAS CONSULTAS</span>
          <h1>Carrito de turnos</h1>
          <p>
            Revisá los horarios que guardaste antes de
            realizar tus reservas.
          </p>
        </div>

        <span className="cart-counter">
          <ShoppingCart size={20} />
          {items.length} {items.length === 1 ? "turno" : "turnos"}
        </span>
      </header>

      <Alert>{mutationError}</Alert>

      {status === "loading" || status === "idle" ? (
        <Loading label="Cargando tu carrito…" />
      ) : status === "failed" ? (
        <ResourceError
          error={{ message: error }}
          retry={reintentar}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Tu carrito está vacío"
          action={
            <Link to="/profesionales" className="button">
              Explorar profesionales
            </Link>
          }
        >
          Todavía no agregaste ningún horario.
          Elegí un profesional para comenzar.
        </EmptyState>
      ) : (
        <>
          <div className="cart-items">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-content">
                  <span className="eyebrow">
                    TURNO PENDIENTE DE RESERVA
                  </span>

                  <h2>Profesional #{item.doctor.id}</h2>

                  <p>
                    <CalendarDays size={17} />
                    {formatDate(item.fechaHoraInicio, {
                      weekday: "long",
                      year: "numeric",
                    })}
                  </p>

                  <p>
                    <Clock size={17} />
                    {formatTime(item.fechaHoraInicio)}
                    {" a "}
                    {formatTime(item.fechaHoraFin)}
                    {" · Buenos Aires"}
                  </p>

                  <Link
                    to={`/profesionales/${item.doctor.id}`}
                    className="cart-doctor-link"
                  >
                    Ver profesional y disponibilidad
                  </Link>
                </div>

                <button
                  type="button"
                  className="button secondary small cart-remove"
                  disabled={mutationStatus === "loading"}
                  onClick={() => quitarTurno(item.id)}
                  aria-label={`Quitar turno del carrito, ítem ${item.id}`}
                >
                  <Trash2 size={16} />
                  {quitandoId === item.id
                    ? "Quitando…"
                    : "Quitar turno"}
                </button>
              </article>
            ))}
          </div>

          <div className="cart-notice">
            <strong>Importante sobre tus horarios</strong>
            <p>
              Agregar un turno al carrito no reserva el horario.
              Otro paciente podría reservarlo antes que vos.
              La disponibilidad se verificará nuevamente
              al realizar la reserva.
            </p>

            <p>
              La confirmación conjunta del carrito todavía
              no está disponible. Por ahora podés volver
              al perfil del médico para reservar individualmente.
            </p>

            <Link to="/profesionales" className="button">
              Seguir buscando profesionales
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
