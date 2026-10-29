import {
  DeviceSummaryStatusType,
  Fleet,
} from '@ansible/portal-hello-world-common';
import type { CatalogItem } from '@ansible/portal-hello-world-common/alpha';
import { StatusPending } from '@backstage/core-components';
import FleetStatus from './FleetStatus';

export const FleetHealth = ({ fleet }: { fleet: Fleet }) => {
  return <FleetStatus fleetStatus={fleet.status} />;
};

export const FleetOs = ({
  fleet,
  catalogItem,
  catalogItemsLoading,
}: {
  fleet: Fleet;
  catalogItem?: CatalogItem;
  catalogItemsLoading?: boolean;
}) => {
  const osSpec = fleet.spec.template.spec.os;
  const catalogItemRef = osSpec?.catalogItemRef;
  const image = osSpec?.image;
  const availableVersions = catalogItem?.spec.versions
    .map(({ version }) => version)
    .join(', ');

  if (!catalogItemRef && !image) {
    return <div>No OS configured</div>;
  }

  return (
    <div>
      <div>
        {catalogItemRef ? (
          <strong>
            {catalogItem?.spec.displayName ?? catalogItemRef.item}
          </strong>
        ) : (
          image
        )}
      </div>
      {catalogItemRef ? (
        <>
          <small>
            {catalogItemRef.catalog}/{catalogItemRef.item}
          </small>
          <br />
          <small>Fleet version: {catalogItemRef.version}</small>
          {catalogItem?.spec.shortDescription && (
            <>
              <br />
              <small>{catalogItem.spec.shortDescription}</small>
            </>
          )}
          {catalogItem ? (
            <>
              <br />
              <small>
                Catalog versions: {availableVersions || 'None listed'}
              </small>
            </>
          ) : catalogItemsLoading ? (
            <StatusPending>Loading catalog item</StatusPending>
          ) : (
            <>
              <br />
              <small>Catalog item details unavailable</small>
            </>
          )}
        </>
      ) : null}
      <div>
        Update state: <StatusPending>WIP</StatusPending>
      </div>
      <small>Rollout progress: WIP</small>
      <br />
      <small>OS source: {catalogItemRef ? 'Catalog' : 'Image'}</small>
    </div>
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

export const FleetCatalog = (_props: { fleet: Fleet }) => {
  return <div>FleetCatalog</div>;
};
