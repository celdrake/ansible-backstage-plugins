import { useCallback } from 'react';
import type { Fleet, FleetList } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

// Adjust the type so it has an "id" and can be used on the table
export type EdgeFleet = Fleet & { id: string };

export type SuccessFleetListState = {
  status: 'loaded';
  fleets: EdgeFleet[];
  refetch: () => void;
};

export type FleetListState =
  | { status: 'loading'; refetch: () => void }
  | { status: 'error'; message: string; refetch: () => void }
  | SuccessFleetListState;

const useFleetList = (): FleetListState => {
  const flightctlFetch = useFlightCtlApiFetch();
  const fetchFleets = useCallback(
    async (signal: AbortSignal) =>
      await flightctlFetch<FleetList>('/fleets', signal),
    [flightctlFetch],
  );
  const { data: fleetList, error, refetch } = useFetchPeriodically(fetchFleets);

  if (fleetList) {
    return {
      status: 'loaded',
      fleets: fleetList.items.map(fleet => ({
        ...fleet,
        id: fleet.metadata.name as string,
      })),
      refetch,
    };
  }
  if (error) {
    return { status: 'error', message: error.message, refetch };
  }
  return { status: 'loading', refetch };
};

export default useFleetList;
