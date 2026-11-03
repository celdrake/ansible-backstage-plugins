import {
  CatalogItemRefSpec,
  DeviceSummaryStatusType,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import { StatusPending } from '@backstage/core-components';
import type {
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-edge-fleets-poc-common/alpha';
import { Badge, Button, Flex, Text } from '@backstage/ui';
import {
  getFleetCatalogItem,
  getNextCatalogItemUpdate,
  getOsCatalogDisplayText,
} from '../../utils/catalogItems';
import { FleetCatalogItemsState } from './types';
import { formatMaintenanceWindow } from '../../utils/time';

const FleetCatalogOs = ({
  catalogItemRef,
  catalogItem,
  hasUpdates,
}: {
  catalogItemRef: CatalogItemRefSpec;
  catalogItem: CatalogItem | undefined;
  hasUpdates: boolean;
}) => {
  // CELIA-WIP: How to show very long catalog item names?
  const osDisplayText = getOsCatalogDisplayText(catalogItemRef, catalogItem);
  return (
    <Flex align="center" gap="2">
      <span>{osDisplayText}</span>
      {hasUpdates && <Badge size="small">Update available</Badge>}
    </Flex>
  );
};

export const FleetOs = ({
  fleet,
  catalogItemState,
}: {
  fleet: Fleet;
  catalogItemState: FleetCatalogItemsState;
}) => {
  const osSpec = fleet.spec.template.spec.os;
  if (!osSpec?.catalogItemRef) {
    return (
      <Text variant="body-small" color="secondary">
        {osSpec?.image ?? 'OS not configured'}
      </Text>
    );
  }

  // CELIA-WIP: Discuss the UX for the loading and error states.
  if (catalogItemState.status === 'loading') {
    return <StatusPending>Loading</StatusPending>;
  }
  // CELIA-WIP: show the error state
  if (catalogItemState.status === 'error') {
    return getOsCatalogDisplayText(osSpec.catalogItemRef, undefined);
  }

  const { catalogItem, hasUpdates } = getFleetCatalogItem(
    fleet,
    catalogItemState.catalogItemsList.items,
  );
  return (
    <FleetCatalogOs
      catalogItem={catalogItem}
      catalogItemRef={osSpec.catalogItemRef}
      hasUpdates={hasUpdates}
    />
  );
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

export const FleetMaintenanceWindow = ({ fleet }: { fleet: Fleet }) => {
  const updatePolicy = fleet.spec.template.spec.updatePolicy;
  const updateSchedule = updatePolicy?.updateSchedule;
  if (!updateSchedule) {
    return 'Updates are immediate';
  }
  return formatMaintenanceWindow(updateSchedule);
};

export const FleetActions = ({
  fleet,
  catalogItemState,
  onUpdate,
}: {
  fleet: Fleet;
  catalogItemState: FleetCatalogItemsState;
  onUpdate: (fleet: Fleet, targetVersion: CatalogItemVersion) => void;
}) => {
  const osSpec = fleet.spec.template.spec.os;
  if (!osSpec?.catalogItemRef || catalogItemState.status === 'error') {
    return null;
  }
  if (catalogItemState.status === 'loading') {
    return <StatusPending>Loading</StatusPending>;
  }

  const { catalogItem } = getFleetCatalogItem(
    fleet,
    catalogItemState.catalogItemsList.items,
  );
  const nextVersion = catalogItem
    ? getNextCatalogItemUpdate(
        catalogItem,
        osSpec.catalogItemRef.channel,
        osSpec.catalogItemRef.version,
      )
    : undefined;
  if (catalogItem && nextVersion) {
    return <Button onClick={() => onUpdate(fleet, nextVersion)}>Update</Button>;
  }
  return null;
};
