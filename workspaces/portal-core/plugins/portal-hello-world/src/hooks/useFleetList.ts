import { useCallback } from 'react';
import type { Fleet, FleetList } from '@ansible/portal-hello-world-common';
import useFetchPeriodically from './useFetchPeriodically';
import useHelloWorldApi from './useHelloWorldApi';

export type SuccessFleetListState = {
  status: 'loaded';
  fleets: Fleet[];
  totalOfflineDevices: number;
};

export type FleetListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | SuccessFleetListState;

const getTotalOfflineDevices = (fleets: Fleet[]) => {
  return fleets.reduce((acc, fleet) => {
    return acc + (fleet.status?.devicesSummary?.total ?? 0);
  }, 0);
};

const useFleetList = (): FleetListState => {
  const fetchJson = useHelloWorldApi();
  const fetchFleets = useCallback(
    async (signal: AbortSignal) => {
      const fleetList = await fetchJson<FleetList>('/fleets', signal, 'fleets');
      if (!fleetList || !Array.isArray(fleetList.items)) {
        throw new Error(
          'The backend returned an invalid Flightctl fleet list.',
        );
      }
      return fleetList;
    },
    [fetchJson],
  );
  const { data: fleetList, error } = useFetchPeriodically(fetchFleets);

  if (fleetList) {
    return {
      status: 'loaded',
      fleets: fleetList.items,
      totalOfflineDevices: getTotalOfflineDevices(fleetList.items),
    };
  }
  if (error) return { status: 'error', message: error.message };
  return { status: 'loading' };
};

export default useFleetList;
