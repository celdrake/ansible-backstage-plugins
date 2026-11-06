export const fleetDetailsRoutePath = '/edge-fleets-poc/fleet/:fleetName';

export const getFleetDetailsPath = (fleetName: string) =>
  `/edge-fleets-poc/fleet/${encodeURIComponent(fleetName)}`;

// CELIA-WIP: This should be a constant in the config.
export const getRhemHomeUrl = () => 'https://edge-manager.redhat.com';
