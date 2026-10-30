import { Fleet } from '@ansible/portal-hello-world-common';
import { CatalogItem } from '@ansible/portal-hello-world-common/alpha';

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
