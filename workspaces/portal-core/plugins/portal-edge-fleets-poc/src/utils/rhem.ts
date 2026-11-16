import { Fleet } from '@ansible/portal-edge-fleets-poc-common';

const RHEM_HOME_URL = 'https://edge-manager.redhat.com';

export const getRhemHomeUrl = () => {
  return RHEM_HOME_URL;
};

export const getFleetLink = (fleet: Fleet) => {
  // CELIA-WIP: DO we have a direct link for ACM?
  // REVIEW CORRECT LINK FOR DIFFERENT DEPLOYMENT TYPES
  return `${RHEM_HOME_URL}/fleets/${fleet.metadata.name}`;
};
