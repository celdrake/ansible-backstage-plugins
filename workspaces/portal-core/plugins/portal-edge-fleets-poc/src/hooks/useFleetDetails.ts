import { useCallback } from 'react';
import type { Fleet } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

const useFleetDetails = (fleetName: string) => {
  const flightctlFetch = useFlightCtlApiFetch();
  const fetchFleetDetails = useCallback(
    async (signal: AbortSignal) =>
      flightctlFetch<Fleet>(
        `/fleets/${encodeURIComponent(fleetName)}?addDevicesSummary=true`,
        signal,
      ),
    [fleetName, flightctlFetch],
  );

  return useFetchPeriodically(fetchFleetDetails, {
    enabled: Boolean(fleetName),
  });
};

export default useFleetDetails;
