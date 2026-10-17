import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";

/**
 * Loads data from the API.
 * Pass `null` as endpoint to skip loading (e.g. not allowed for this role).
 * Returns { data, error, loading, reload, mutate }.
 */
export default function useApiData(endpoint) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  const key = endpoint ? `${endpoint}#${version}` : null;

  useEffect(() => {
    if (!key) return undefined;

    let ignore = false;

    apiRequest(endpoint)
      .then((data) => {
        if (!ignore) setResult({ key, data, error: "" });
      })
      .catch((err) => {
        if (!ignore) {
          setResult((previous) => ({
            key,
            data: previous.data,
            error: err.message,
          }));
        }
      });

    return () => {
      ignore = true;
    };
  }, [endpoint, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const mutate = useCallback(
    (updater) =>
      setResult((previous) => ({ ...previous, data: updater(previous.data) })),
    []
  );

  return {
    data: result.data,
    error: key && result.key === key ? result.error : "",
    loading: Boolean(key) && result.key !== key,
    reload,
    mutate,
  };
}
