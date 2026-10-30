import { CatalogItem } from '@ansible/portal-hello-world-common/alpha';

export type FleetCatalogItemsState =
  | { status: 'loading' }
  | { status: 'loaded'; catalogItems: CatalogItem[] }
  | { status: 'error'; message: string };
