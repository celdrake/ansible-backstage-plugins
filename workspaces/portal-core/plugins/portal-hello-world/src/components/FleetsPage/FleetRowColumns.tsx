import {
  DeviceOsSpec,
  DeviceSummaryStatusType,
  Fleet,
} from '@ansible/portal-hello-world-common';
import { StatusPending } from '@backstage/core-components';
import { CatalogItem } from '@ansible/portal-hello-world-common/alpha';
import { getFleetCatalogItem } from '../../utils/catalogItems';
import { FleetCatalogItemsState } from './types';

import FleetStatus from './FleetStatus';

export const FleetHealth = ({ fleet }: { fleet: Fleet }) => {
  return <FleetStatus fleetStatus={fleet.status} />;
};

const FleetCatalogOs = ({
  osSpec,
  catalogItem,
}: {
  osSpec: DeviceOsSpec | undefined;
  catalogItem: CatalogItem | undefined;
}) => {
  return <div>{catalogItem?.spec.displayName ?? 'OS not configured'}</div>;
};

export const FleetOs = ({
  fleet,
  catalogItemState,
}: {
  fleet: Fleet;
  catalogItemState: FleetCatalogItemsState;
}) => {
  // CELIA-WIP: Discuss the UX for the loading and error states.

  if (catalogItemState.status === 'loading') {
    return <StatusPending>Loading</StatusPending>;
  }
  if (catalogItemState.status === 'error') {
    return 'OS Unavailable';
  }

  const osSpec = fleet.spec.template.spec.os;
  if (!osSpec || !osSpec.catalogItemRef) {
    return <div>{osSpec?.image ?? 'OS not configured'}</div>;
  }
  const catalogItem = getFleetCatalogItem(fleet, catalogItemState.catalogItems);
  return <FleetCatalogOs osSpec={osSpec} catalogItem={catalogItem} />;
};

export const FleetDevicesCount = ({ fleet }: { fleet: Fleet }) => {
  const summary = fleet.status?.devicesSummary;
  if (!summary) {
    // CELIA-WIP: Discuss the UX for a missing addDevicesSummary response.
    return <StatusPending>WIP</StatusPending>;
  }

  const online =
    summary.summaryStatus[DeviceSummaryStatusType.DeviceSummaryStatusOnline] ??
    0;
  return `${online}/${summary.total} online`;
};
