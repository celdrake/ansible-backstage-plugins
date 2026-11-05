import { useCallback } from 'react';
import type { DeviceList } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

const useDevicesSummary = () => {
  const flightctlFetch = useFlightCtlApiFetch();
  const fetchDevicesSummary = useCallback(
    async (signal: AbortSignal) => {
      const deviceList = await flightctlFetch<DeviceList>(
        '/devices?summaryOnly=true',
        signal,
      );
      return deviceList.summary;
    },
    [flightctlFetch],
  );

  return useFetchPeriodically(fetchDevicesSummary);
};

export default useDevicesSummary;
