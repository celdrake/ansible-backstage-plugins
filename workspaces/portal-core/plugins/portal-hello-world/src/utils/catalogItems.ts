import semver from 'semver';
import { CatalogItemRefSpec, Fleet } from '@ansible/portal-hello-world-common';
import {
  CatalogItemArtifactType,
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-hello-world-common/alpha';

export const getFleetCatalogItem = (
  fleet: Fleet,
  catalogItems: CatalogItem[],
) => {
  const osRef = fleet.spec.template.spec.os?.catalogItemRef;
  if (!osRef) {
    return undefined;
  }
  return catalogItems.find(
    item =>
      item.metadata.name === osRef.item &&
      item.metadata.catalog === osRef.catalog,
  );
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

export const getOsCatalogDisplayText = (catalogItemRef: CatalogItemRefSpec) => {
  return `${catalogItemRef.item}:${catalogItemRef.version ?? 'unknown'}`;
};
