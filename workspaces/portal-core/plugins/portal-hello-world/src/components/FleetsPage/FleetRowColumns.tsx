import {
  CatalogItemRefSpec,
  DeviceSummaryStatusType,
  Fleet,
} from '@ansible/portal-hello-world-common';
import { StatusPending } from '@backstage/core-components';
import { CatalogItem } from '@ansible/portal-hello-world-common/alpha';
import { Badge, Flex, Text } from '@backstage/ui';
import {
  getCatalogItemUpdates,
  getFleetCatalogItem,
  getOsCatalogDisplayText,
} from '../../utils/catalogItems';
import { FleetCatalogItemsState } from './types';

const FleetCatalogOs = ({
  catalogItemRef,
  catalogItem,
}: {
  catalogItemRef: CatalogItemRefSpec;
  catalogItem: CatalogItem | undefined;
}) => {
  const hasUpdates =
    !!catalogItem &&
    getCatalogItemUpdates(
      catalogItem,
      catalogItemRef.channel,
      catalogItemRef.version,
    ).length > 0;

  return (
    <Flex align="center" gap="2">
      <span>{getOsCatalogDisplayText(catalogItemRef)}</span>
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
  // CELIA-WIP: Discuss the UX for the loading and error states.

  if (catalogItemState.status === 'loading') {
    return <StatusPending>Loading</StatusPending>;
  }
  if (catalogItemState.status === 'error') {
    return 'OS Unavailable';
  }

  const osSpec = fleet.spec.template.spec.os;
  if (!osSpec || !osSpec.catalogItemRef) {
    return (
      <Text variant="body-small" color="secondary">
        {osSpec?.image ?? 'OS not configured'}
      </Text>
    );
  }
  const catalogItem = getFleetCatalogItem(
    fleet,
    catalogItemState.catalogItemsList.items,
  );
  return (
    <FleetCatalogOs
      catalogItem={catalogItem}
      catalogItemRef={osSpec.catalogItemRef}
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
