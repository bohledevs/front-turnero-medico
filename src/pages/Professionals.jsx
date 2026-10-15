import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { api } from "../services/api";
import useResource from "../hooks/useResource";
import DoctorCard from "../components/DoctorCard";
import PageHeading from "../components/PageHeading";
import Field from "../components/Field";
import { EmptyState, Loading, ResourceError } from "../components/Feedback";
export default function Professionals() {
  const [params, setParams] = useSearchParams();
  const specialty = params.get("especialidadId") || "";
  const name = params.get("nombre") || "";
  const [draft, setDraft] = useState(name);
  useEffect(() => {
    setDraft(name); // eslint-disable-line react-hooks/set-state-in-effect
  }, [name]);
  const specialties = useResource(
    useCallback((signal) => api.specialties(signal), []),
  );
  const doctors = useResource(
    useCallback(
      (signal) =>
        api.doctors({ especialidadId: specialty, nombre: name }, signal),
      [specialty, name],
    ),
  );
  function filter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }
  return (
    <div className="container page">
      <PageHeading
        eyebrow="ENCONTRÁ TU PROFESIONAL"
        title="El próximo paso para cuidarte."
        description="Buscá por especialidad o nombre y elegí un horario que se adapte a vos."
      />
      <div className="directory-layout">
        <aside className="filter-panel">
          <h2>
            <SlidersHorizontal size={18} /> Filtrar búsqueda
          </h2>
          <form
            className="stack"
            onSubmit={(event) => {
              event.preventDefault();
              filter("nombre", draft.trim());
            }}
          >
            <Field
              label="Nombre del profesional"
              placeholder="Buscar por nombre…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Field
              as="select"
              label="Especialidad"
              value={specialty}
              onChange={(event) => filter("especialidadId", event.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {specialties.data?.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </Field>
            <button className="button full">
              <Search size={17} />
              Buscar
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setDraft("");
                setParams({});
              }}
            >
              Limpiar filtros
            </button>
          </form>
          {specialties.error && (
            <ResourceError
              error={specialties.error}
              retry={specialties.reload}
            />
          )}
          <div className="help-note">
            <strong>A tu medida</strong>
            <p>
              Podés consultar horarios antes de ingresar. Para reservar,
              necesitás una cuenta de paciente.
            </p>
          </div>
        </aside>
        <section aria-label="Resultados de profesionales">
          <div className="results-heading">
            <h2>Profesionales disponibles</h2>
            {!doctors.loading && doctors.data && (
              <span>
                {doctors.data.length} resultado
                {doctors.data.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {doctors.loading ? (
            <Loading />
          ) : doctors.error ? (
            <ResourceError error={doctors.error} retry={doctors.reload} />
          ) : doctors.data?.length ? (
            <div className="directory-grid">
              {doctors.data.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <EmptyState title="No encontramos profesionales">
              Probá con otro nombre o elegí una especialidad diferente.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
