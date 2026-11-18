export const fleetDetailsRoutePath = '/edge-fleets-poc/fleet/:fleetName';

export const getFleetDetailsPath = (fleetName: string) =>
  `/edge-fleets-poc/fleet/${encodeURIComponent(fleetName)}`;

export const getFleetsPath = () => '/edge-fleets-poc/fleets';

export const getRhemHomeUrl = () => 'https://edge-manager.redhat.com';

export const getRhemFleetUrl = (fleetName: string) =>
  `${getRhemHomeUrl()}${getFleetDetailsPath(fleetName)}`;
