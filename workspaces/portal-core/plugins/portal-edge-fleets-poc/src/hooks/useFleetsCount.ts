import { useCallback } from 'react';
import { FleetList } from '@ansible/portal-edge-fleets-poc-common';

import useFlightCtlApiFetch from './useFlightCtlApiFetch';
import useFetchPeriodically from './useFetchPeriodically';

const useFleetsCount = () => {
  const flightctlFetch = useFlightCtlApiFetch();
  const fetchFleetsCount = useCallback(
    async (signal: AbortSignal) => {
      const fleetList = await flightctlFetch<FleetList>(
        '/fleets?limit=1',
        signal,
      );
      if (fleetList.items.length > 0) {
        return (fleetList.metadata?.remainingItemCount ?? 0) + 1;
      }
      return 0;
    },
    [flightctlFetch],
  );

  return useFetchPeriodically(fetchFleetsCount);
};

export default useFleetsCount;
