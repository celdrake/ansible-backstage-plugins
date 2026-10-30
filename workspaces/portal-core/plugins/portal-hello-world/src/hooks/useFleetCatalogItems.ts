import { useCallback } from 'react';
import type { CatalogItemList } from '@ansible/portal-hello-world-common/alpha';
import type { FleetCatalogItemsState } from '../components/FleetsPage/types';
import useFetchPeriodically from './useFetchPeriodically';
import useHelloWorldApi from './useHelloWorldApi';

const useFleetCatalogItems = (fleetNames: string[]): FleetCatalogItemsState => {
  const fetchJson = useHelloWorldApi();
  const fleetNamesKey = fleetNames.join('\u0000');
  const hasFleetNames = fleetNames.length > 0;

  const fetchCatalogItems = useCallback(
    async (signal: AbortSignal) => {
      const query = new URLSearchParams();
      fleetNamesKey
        .split('\u0000')
        .forEach(name => query.append('fleet', name));
      const catalogItemList = await fetchJson<CatalogItemList>(
        `/catalogitems?${query.toString()}`,
        signal,
        'OS catalog items',
      );
      if (!catalogItemList || !Array.isArray(catalogItemList.items)) {
        throw new Error(
          'The backend returned an invalid Flightctl catalog item list.',
        );
      }
      return catalogItemList.items;
    },
    [fetchJson, fleetNamesKey],
  );
  const periodicState = useFetchPeriodically(fetchCatalogItems, {
    enabled: hasFleetNames,
  });

  if (!hasFleetNames) {
    return { status: 'loaded', catalogItems: [] };
  }
  if (periodicState.data) {
    return { status: 'loaded', catalogItems: periodicState.data };
  }
  if (periodicState.error) {
    return { status: 'error', message: periodicState.error.message };
  }
  return { status: 'loading' };
};

export default useFleetCatalogItems;
