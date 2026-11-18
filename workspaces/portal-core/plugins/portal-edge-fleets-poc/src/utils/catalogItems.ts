import semver from 'semver';
import { CatalogItemRefSpec } from '@ansible/portal-edge-fleets-poc-common';
import {
  CatalogItemArtifactType,
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-edge-fleets-poc-common/alpha';

export const getOsCatalogItem = (
  osItemRef: CatalogItemRefSpec,
  catalogItems: CatalogItem[],
) => {
  const catalogItem = catalogItems.find(
    item =>
      item.metadata.name === osItemRef.item &&
      item.metadata.catalog === osItemRef.catalog,
  );

  const versionToUpdate = catalogItem
    ? getNextCatalogItemUpdate(
        catalogItem,
        osItemRef.channel,
        osItemRef.version,
      )
    : undefined;

  return {
    catalogItem,
    versionToUpdate,
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

export const getOsCatalogItemDisplayText = (
  catalogItem: CatalogItem,
  version: string,
) => `${catalogItem.spec.displayName || catalogItem.metadata.name} ${version}`;

export const getOsCatalogRefDisplayText = (
  catalogItemRef: CatalogItemRefSpec,
) => {
  if (!catalogItemRef.version) {
    return catalogItemRef.item;
  }
  return `${catalogItemRef.item} ${catalogItemRef.version}`;
};

export const getOsDisplayText = (
  catalogItemRef: CatalogItemRefSpec,
  catalogItem: CatalogItem | undefined,
  versionToUpdate: CatalogItemVersion | undefined,
) => {
  let currentVersionText = null;
  let nextVersionText = null;
  if (catalogItem) {
    currentVersionText = getOsCatalogItemDisplayText(
      catalogItem,
      catalogItemRef.version,
    );
    if (versionToUpdate) {
      nextVersionText = getOsCatalogItemDisplayText(
        catalogItem,
        versionToUpdate.version,
      );
    }
  } else {
    currentVersionText = getOsCatalogRefDisplayText(catalogItemRef);
    if (versionToUpdate) {
      nextVersionText = `${catalogItemRef.item} ${versionToUpdate.version}`;
    }
  }
  return {
    currentVersionText,
    nextVersionText,
  };
};
