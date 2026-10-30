import { useEffect, useState } from 'react';

const DEFAULT_INTERVAL_MS = 10_000;

export type PeriodicFetchState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: Error | undefined;
  isUpdating: boolean;
};

type UseFetchPeriodicallyOptions = {
  enabled?: boolean;
  intervalMs?: number;
};

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

const useFetchPeriodically = <T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  {
    enabled = true,
    intervalMs = DEFAULT_INTERVAL_MS,
  }: UseFetchPeriodicallyOptions = {},
): PeriodicFetchState<T> => {
  const [state, setState] = useState<PeriodicFetchState<T>>({
    data: undefined,
    isLoading: enabled,
    error: undefined,
    isUpdating: false,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        data: undefined,
        isLoading: false,
        error: undefined,
        isUpdating: false,
      });
      return undefined;
    }

    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let abortController: AbortController | undefined;

    const fetchAndSchedule = async () => {
      abortController = new AbortController();
      setState(previous => ({
        ...previous,
        isLoading: previous.data === undefined,
        isUpdating: previous.data !== undefined,
        error: previous.data === undefined ? undefined : previous.error,
      }));

      try {
        const data = await fetcher(abortController.signal);
        if (!active || abortController.signal.aborted) return;
        setState({
          data,
          isLoading: false,
          error: undefined,
          isUpdating: false,
        });
      } catch (error) {
        if (!active || abortController.signal.aborted) return;
        setState(previous => ({
          data: previous.data,
          isLoading: false,
          error: toError(error),
          isUpdating: false,
        }));
      }

      if (active) {
        timeout = setTimeout(fetchAndSchedule, intervalMs);
      }
    };

    void fetchAndSchedule();

    return () => {
      active = false;
      if (timeout) clearTimeout(timeout);
      abortController?.abort();
    };
  }, [enabled, fetcher, intervalMs]);

  return state;
};

export default useFetchPeriodically;
