import { useCallback } from 'react';
import type { Fleet, FleetList } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

export type SuccessFleetListState = {
  status: 'loaded';
  fleets: Fleet[];
  totalOfflineDevices: number;
  refetch: () => void;
};

export type FleetListState =
  | { status: 'loading'; refetch: () => void }
  | { status: 'error'; message: string; refetch: () => void }
  | SuccessFleetListState;

const getTotalOfflineDevices = (fleets: Fleet[]) => {
  return fleets.reduce((acc, fleet) => {
    return acc + (fleet.status?.devicesSummary?.total ?? 0);
  }, 0);
};

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
      fleets: fleetList.items,
      totalOfflineDevices: getTotalOfflineDevices(fleetList.items),
      refetch,
    };
  }
  if (error) {
    return { status: 'error', message: error.message, refetch };
  }
  return { status: 'loading', refetch };
};

export default useFleetList;
