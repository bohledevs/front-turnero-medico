import { useEffect, useState } from "react";
export default function useResource(loader) {
  const [result, setResult] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    // La carga y su limpieza pertenecen al efecto que consulta la API.
    setResult((previous) => ({ ...previous, loading: true, error: null })); // eslint-disable-line react-hooks/set-state-in-effect
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [loader, revision]);
  return { ...result, reload: () => setRevision((value) => value + 1) };
}
