import { CatalogItemList } from '@ansible/portal-hello-world-common/alpha';

export type FleetCatalogItemsState =
  | { status: 'loading' }
  | { status: 'loaded'; catalogItemsList: CatalogItemList }
  | { status: 'error'; message: string };
