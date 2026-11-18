import { CatalogItemList } from '@ansible/portal-edge-fleets-poc-common/alpha';

export type FleetCatalogItemsState =
  | { status: 'loading' }
  | { status: 'loaded'; catalogItemsList: CatalogItemList }
  | { status: 'error'; message: string };
