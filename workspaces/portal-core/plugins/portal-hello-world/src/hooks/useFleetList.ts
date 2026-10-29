import { Fleet } from '@ansible/portal-hello-world-common';
import { useEffect, useState } from 'react';
import { FLEET_LIST } from '../components/Fleets/fleetDemoData';

const getTotalOfflineDevices = (fleets: Fleet[]) => {
  return fleets.reduce((acc, fleet) => {
    return acc + (fleet.status?.devicesSummary?.total ?? 0);
  }, 0);
};

const useFleetList = () => {
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [totalOfflineDevices, setTotalOfflineDevices] = useState<number>(0);

  useEffect(() => {
    const fetchFleets = () => {
      const fleets = FLEET_LIST.items;
      setFleets(fleets);
      setTotalOfflineDevices(getTotalOfflineDevices(fleets));
    };
    fetchFleets();
  }, []);
  return { fleets, totalOfflineDevices };
};

export default useFleetList;
