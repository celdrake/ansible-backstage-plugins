import {
  CatalogItemRefSpec,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import { StatusPending } from '@backstage/core-components';
import type { CatalogItemVersion } from '@ansible/portal-edge-fleets-poc-common/alpha';
import { Button, Text } from '@backstage/ui';
import {
  getOsCatalogItem,
  getOsCatalogItemDisplayText,
  getOsCatalogRefDisplayText,
} from '../../utils/catalogItems';
import { FleetCatalogItemsState } from './types';
import { formatMaintenanceWindow } from '../../utils/time';
import UpdateAvailableBadge from '../common/UpdateAvailableBadge';
import styles from './FleetsPage.module.css';

const FleetCatalogOs = ({
  osItemRef,
  catalogItemState,
}: {
  osItemRef: CatalogItemRefSpec;
  catalogItemState: FleetCatalogItemsState;
}) => {
  // CELIA-WIP: Discuss the UX for the loading and error states.
  if (catalogItemState.status === 'loading') {
    return <StatusPending>Loading</StatusPending>;
  }
  // CELIA-WIP: show the error state
  if (catalogItemState.status === 'error') {
    return getOsCatalogRefDisplayText(osItemRef);
  }

  const { catalogItem, versionToUpdate } = getOsCatalogItem(
    osItemRef,
    catalogItemState.catalogItemsList.items,
  );
  if (!catalogItem) {
    return (
      <Text variant="body-small" color="secondary">
        {getOsCatalogRefDisplayText(osItemRef)}
      </Text>
    );
  }

  const currentOs = getOsCatalogItemDisplayText(catalogItem, osItemRef.version);
  if (!versionToUpdate) {
    return <Text variant="body-medium">Target: {currentOs}</Text>;
  }
  return (
    <div className={styles.fleetsPageStackLayout}>
      <UpdateAvailableBadge />
      <Text variant="body-medium">Target: {currentOs}</Text>
      <Text variant="body-small" color="secondary">
        Available:{' '}
        {getOsCatalogItemDisplayText(catalogItem, versionToUpdate.version)}
      </Text>
    </div>
  );
};

const FleetCustomOsImage = ({ image }: { image: string }) => {
  return (
    <div className={styles.fleetsPageStackLayout}>
      <Text variant="body-medium">Custom image · Managed in Edge Manager</Text>
      <Text variant="body-small" color="secondary">
        {image}
      </Text>
    </div>
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
  if (osSpec?.image) {
    return <FleetCustomOsImage image={osSpec.image} />;
  } else if (!osSpec?.catalogItemRef) {
    return <Text variant="body-medium">No OS image defined</Text>;
  }
  return (
    <FleetCatalogOs
      osItemRef={osSpec.catalogItemRef}
      catalogItemState={catalogItemState}
    />
  );
};

// CELIA-WIP: Not used right now.
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

  const { catalogItem, versionToUpdate } = getOsCatalogItem(
    osSpec.catalogItemRef,
    catalogItemState.catalogItemsList.items,
  );

  if (catalogItem && versionToUpdate) {
    return (
      <Button onClick={() => onUpdate(fleet, versionToUpdate)}>Update</Button>
    );
  }
  return null;
};
