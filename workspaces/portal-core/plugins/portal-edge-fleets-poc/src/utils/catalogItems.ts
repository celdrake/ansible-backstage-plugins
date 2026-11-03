import semver from 'semver';
import {
  CatalogItemRefSpec,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import {
  CatalogItemArtifactType,
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-edge-fleets-poc-common/alpha';

export const getFleetCatalogItem = (
  fleet: Fleet,
  catalogItems: CatalogItem[],
) => {
  const osRef = fleet.spec.template.spec.os?.catalogItemRef;
  if (!osRef) {
    return {
      catalogItem: undefined,
      hasUpdates: false,
    };
  }

  const catalogItem = catalogItems.find(
    item =>
      item.metadata.name === osRef.item &&
      item.metadata.catalog === osRef.catalog,
  );

  const hasUpdates =
    !!catalogItem &&
    getCatalogItemUpdates(catalogItem, osRef.channel, osRef.version).length > 0;

  return {
    catalogItem,
    hasUpdates,
  };
};

const hasContainerImage = (
  catalogItem: CatalogItem,
  version: CatalogItemVersion,
) => {
  const containerArtifact = catalogItem.spec.artifacts.find(
    artifact =>
      artifact.type ===
      CatalogItemArtifactType.CatalogItemArtifactTypeContainer,
  );
  return Boolean(
    containerArtifact && version.references[containerArtifact.type],
  );
};

/**
 * Returns versions that can directly update the current version on its channel.
 * This follows the Cincinnati upgrade graph used by the Flightctl UI.
 */
export const getCatalogItemUpdates = (
  catalogItem: CatalogItem,
  currentChannel: string | undefined,
  currentVersion: string | undefined,
): CatalogItemVersion[] => {
  if (!currentChannel || !currentVersion) {
    return [];
  }

  const updateVersions = catalogItem.spec.versions.filter(version => {
    if (!version.channels.includes(currentChannel)) {
      return false;
    }

    if (version.replaces === currentVersion) {
      return true;
    }

    if (version.skips?.includes(currentVersion)) {
      return true;
    }

    return Boolean(
      version.skipRange &&
        semver.satisfies(currentVersion, version.skipRange, {
          includePrerelease: true,
        }),
    );
  });

  return updateVersions.filter(version =>
    hasContainerImage(catalogItem, version),
  );
};

/**
 * Returns the highest semver version that can directly update the current
 * version on its channel, matching the locked update flow in Flightctl UI.
 */
export const getNextCatalogItemUpdate = (
  catalogItem: CatalogItem,
  currentChannel: string | undefined,
  currentVersion: string | undefined,
): CatalogItemVersion | undefined =>
  getCatalogItemUpdates(catalogItem, currentChannel, currentVersion).sort(
    (a, b) => semver.rcompare(a.version, b.version),
  )[0];

export const getOsCatalogDisplayText = (
  catalogItemRef: CatalogItemRefSpec,
  catalogItem: CatalogItem | undefined,
) => {
  if (!catalogItem) {
    return `${catalogItemRef.item}:${catalogItemRef.version ?? 'unknown'}`;
  }
  return `${catalogItem.spec.displayName || catalogItem.metadata.name}:${
    catalogItemRef.version
  }`;
};
