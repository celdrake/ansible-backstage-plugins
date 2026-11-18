import { useCallback, useMemo } from 'react';
import type { CatalogItemList } from '@ansible/portal-edge-fleets-poc-common/alpha';
import type { FleetCatalogItemsState } from '../components/FleetsPage/types';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

const useFleetCatalogItems = (fleetNames: string[]): FleetCatalogItemsState => {
  const flightctlFetch = useFlightCtlApiFetch();
  const fleetNamesKey = fleetNames.join('\u0000');
  const hasFleetNames = fleetNames.length > 0;

  const fetchCatalogItems = useCallback(
    async (signal: AbortSignal) => {
      const query = new URLSearchParams();
      fleetNamesKey
        .split('\u0000')
        .forEach(name => query.append('fleet', name));

      return await flightctlFetch<CatalogItemList>(
        `/catalogitems?${query.toString()}`,
        signal,
      );
    },
    [flightctlFetch, fleetNamesKey],
  );
  const periodicState = useFetchPeriodically(fetchCatalogItems, {
    enabled: hasFleetNames,
  });
  const errorMessage = periodicState.data
    ? undefined
    : periodicState.error?.message;
  const hasError = !periodicState.data && periodicState.error !== undefined;

  return useMemo(() => {
    if (periodicState.data) {
      return { status: 'loaded', catalogItemsList: periodicState.data };
    }
    if (hasError) {
      return { status: 'error', message: errorMessage ?? '' };
    }
    return { status: 'loading' };
  }, [periodicState.data, errorMessage, hasError]);
};

export default useFleetCatalogItems;
