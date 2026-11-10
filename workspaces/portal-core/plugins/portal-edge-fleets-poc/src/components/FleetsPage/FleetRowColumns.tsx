import React from 'react';
import {
  CatalogItemRefSpec,
  ConditionStatus,
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
import { getFleetDetailsPath } from '../../utils/routes';
import { FleetCatalogItemsState } from './types';
import UpdateAvailableBadge from '../common/UpdateAvailableBadge';
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
    return <FleetOsText text={getOsCatalogRefDisplayText(osItemRef)} />;
  }

  const currentOs = getOsCatalogItemDisplayText(catalogItem, osItemRef.version);
  if (!versionToUpdate) {
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
    return <FleetOsText text="No OS image defined" />;
  }
  return (
    <FleetCatalogOs
      osItemRef={osSpec.catalogItemRef}
      catalogItemState={catalogItemState}
    />
  );
};

// CELIA-WIP: UNIFY THIS ROUTE
const RHEM_HOME_URL = 'https://edge-manager.redhat.com';

const getEdgeManagerLink = (fleet: Fleet) => {
  // CELIA-WIP: DO we have a direct link for ACM?
  // REVIEW CORRECT LINK FOR DIFFERENT DEPLOYMENT TYPES
  return `${RHEM_HOME_URL}/fleets/${fleet.metadata.name}`;
};

const shouldLinkToEdgeManager = (fleet: Fleet) => {
  // Fleets with "sync pending / invalid" status should link to Edge Manager
  const validCondition = fleet.status?.conditions?.find(
    condition => condition.type === 'Valid',
  );
  if (
    !validCondition ||
    validCondition.status !== ConditionStatus.ConditionStatusTrue
  ) {
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
    targetVersion: CatalogItemVersion,
    targetOsLabel: string,
  ) => void;
}) => {
  const handleOsUpdate = React.useCallback(
    (
      catalogItem: CatalogItem | undefined,
      versionToUpdate: CatalogItemVersion | undefined,
    ) => {
      if (catalogItem && versionToUpdate) {
        onUpdate(
          fleet,
          versionToUpdate,
          getOsCatalogItemDisplayText(catalogItem, versionToUpdate.version),
        );
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
            aria-label={`Actions for ${fleet.metadata.name}`}
            icon={<RiMore2Line aria-hidden size={20} />}
          />
          <Menu className={styles.fleetListActionsMenu}>
            <MenuItem href={getFleetDetailsPath(fleet.metadata.name as string)}>
              Open fleet
            </MenuItem>
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
                href={getEdgeManagerLink(fleet)}
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
