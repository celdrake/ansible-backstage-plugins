import { Fleet } from '@ansible/portal-edge-fleets-poc-common';

export type OsType = 'catalog' | 'custom' | 'none';

export const getFleetOsMode = (fleet: Fleet): OsType => {
  const osSpec = fleet.spec.template.spec.os;
  if (osSpec?.catalogItemRef) {
    return 'catalog';
  }
  if (osSpec?.image) {
    return 'custom';
  }
  return 'none';
};

export const getFleetOsSourceDetail = (osMode: OsType): string => {
  switch (osMode) {
    case 'catalog':
      return 'Managed catalog OS. Portal can set a new target when a newer version is available.';
    case 'custom':
      return 'Manual image URL from Edge Manager. Catalog update comparison is not available.';
    case 'none':
      return 'OS image can be assigned in Edge Manager.';
  }
};

export const getOsSourceLabel = (osMode: OsType): string => {
  switch (osMode) {
    case 'catalog':
      return 'Software Catalog';
    case 'custom':
      return 'Custom image';
    case 'none':
      return 'Not set';
  }
};
