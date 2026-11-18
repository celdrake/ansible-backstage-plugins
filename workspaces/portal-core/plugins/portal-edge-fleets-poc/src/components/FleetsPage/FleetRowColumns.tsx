import React from 'react';
import {
  CatalogItemRefSpec,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import { StatusPending } from '@backstage/core-components';
import type {
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-edge-fleets-poc-common/alpha';
import {
  Button,
  ButtonIcon,
  Flex,
  Menu,
  MenuItem,
  MenuTrigger,
  Text,
} from '@backstage/ui';
import { RiMore2Line } from '@remixicon/react';
import {
  getOsCatalogItem,
  getOsCatalogItemDisplayText,
  getOsCatalogRefDisplayText,
} from '../../utils/catalogItems';
import { UpdateAvailableBadge } from '../common/Badges';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { updateFleetPermission } from '../../constants/permissions';
import { getRhemFleetUrl } from '../../utils/routes';
import { FleetCatalogItemsState } from './types';
import { getFleetStatusItem } from './FleetStatus';

import styles from './FleetsPage.module.css';

const FleetOsText = ({ text }: { text: string }) => {
  return (
    <Text variant="body-medium" weight="bold" className={styles.osPrimaryText}>
      {text}
    </Text>
  );
};

const FleetCatalogOs = ({
  osItemRef,
  catalogItemState,
  isFleetEditable,
}: {
  osItemRef: CatalogItemRefSpec;
  catalogItemState: FleetCatalogItemsState;
  isFleetEditable: boolean;
}) => {
  if (catalogItemState.status === 'loading') {
    return <StatusPending>Loading</StatusPending>;
  }
  if (catalogItemState.status === 'error') {
    return getOsCatalogRefDisplayText(osItemRef);
  }

  const { catalogItem, versionToUpdate } = getOsCatalogItem(
    osItemRef,
    catalogItemState.catalogItemsList.items,
  );
  if (!catalogItem) {
    return <FleetOsText text={getOsCatalogRefDisplayText(osItemRef)} />;
  }

  const currentOs = getOsCatalogItemDisplayText(catalogItem, osItemRef.version);
  if (!versionToUpdate || !isFleetEditable) {
    return <FleetOsText text={`Target: ${currentOs}`} />;
  }

  return (
    <div className={styles.fleetsPageStackLayout}>
      <FleetOsText text={`Target: ${currentOs}`} />
      <UpdateAvailableBadge />
      <Text variant="body-small" color="secondary">
        {`Available ${getOsCatalogItemDisplayText(
          catalogItem,
          versionToUpdate.version,
        )}`}
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
    return <FleetOsText text={osSpec.image} />;
  } else if (!osSpec?.catalogItemRef) {
    return <FleetOsText text="No OS defined" />;
  }
  const fleetStatusItem = getFleetStatusItem(fleet.status);
  return (
    <FleetCatalogOs
      osItemRef={osSpec.catalogItemRef}
      catalogItemState={catalogItemState}
      isFleetEditable={fleetStatusItem.id === 'Valid'}
    />
  );
};

const shouldLinkToEdgeManager = (fleet: Fleet) => {
  // Fleets with "sync pending / invalid" status should link to Edge Manager
  const isValid = getFleetStatusItem(fleet.status).id === 'Valid';
  if (!isValid) {
    return true;
  }

  // Fleets that have a custom image, or no image set, should link to Edge Manager
  return !fleet.spec.template.spec.os?.catalogItemRef;
};

export const FleetActions = ({
  fleet,
  catalogItemState,
  onUpdate,
}: {
  fleet: Fleet;
  catalogItemState: FleetCatalogItemsState;
  onUpdate: (
    fleet: Fleet,
    osCatalogItem: CatalogItem,
    targetVersion: CatalogItemVersion,
  ) => void;
}) => {
  const fleetName = fleet.metadata.name as string;
  const { checkPermissions } = useUserPermissions();
  const [canEditFleet] = checkPermissions([updateFleetPermission]);
  const handleOsUpdate = React.useCallback(
    (
      catalogItem: CatalogItem | undefined,
      versionToUpdate: CatalogItemVersion | undefined,
    ) => {
      if (catalogItem && versionToUpdate) {
        onUpdate(fleet, catalogItem, versionToUpdate);
      }
    },
    [fleet, onUpdate],
  );

  if (catalogItemState.status === 'error') {
    return null;
  }
  if (catalogItemState.status === 'loading') {
    return <StatusPending>Loading</StatusPending>;
  }

  const catalogItemRef = fleet.spec.template.spec.os?.catalogItemRef;
  const catalogItemResult = catalogItemRef
    ? getOsCatalogItem(catalogItemRef, catalogItemState.catalogItemsList.items)
    : { catalogItem: undefined, versionToUpdate: undefined };

  const canUpdate =
    canEditFleet &&
    catalogItemResult.catalogItem !== undefined &&
    catalogItemResult.versionToUpdate !== undefined;

  const hasRhemLink = shouldLinkToEdgeManager(fleet);
  return (
    <Flex gap="2">
      {canUpdate && (
        <Flex direction="column" grow={1}>
          <Button
            onClick={() =>
              handleOsUpdate(
                catalogItemResult.catalogItem,
                catalogItemResult.versionToUpdate,
              )
            }
          >
            Update OS target
          </Button>
        </Flex>
      )}
      <div className={styles.fleetListActionsMenuWrapper}>
        <MenuTrigger>
          <ButtonIcon
            variant="secondary"
            size="small"
            aria-label={`Actions for ${fleetName}`}
            icon={<RiMore2Line aria-hidden size={20} />}
          />
          <Menu className={styles.fleetListActionsMenu}>
            <MenuItem href={getRhemFleetUrl(fleetName)}>Open fleet</MenuItem>
            {canUpdate && (
              <MenuItem
                onAction={() =>
                  handleOsUpdate(
                    catalogItemResult.catalogItem,
                    catalogItemResult.versionToUpdate,
                  )
                }
              >
                Update OS target
              </MenuItem>
            )}
            {hasRhemLink && (
              <MenuItem
                href={getRhemFleetUrl(fleetName)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fleetActionsMenuItem}
              >
                Open Edge Manager
              </MenuItem>
            )}
          </Menu>
        </MenuTrigger>
      </div>
    </Flex>
  );
};
