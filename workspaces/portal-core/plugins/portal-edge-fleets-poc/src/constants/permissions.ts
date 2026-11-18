export enum RESOURCE {
  CATALOG = 'catalogs',
  CATALOG_ITEM = 'catalogitems',
  FLEET = 'fleets',
}

export enum VERB {
  CREATE = 'create',
  LIST = 'list',
  GET = 'get',
  PATCH = 'patch',
  POST = 'post',
  UPDATE = 'update',
}

export const listFleetsPermission = { kind: RESOURCE.FLEET, verb: VERB.LIST };

export const viewFleetDetailsPermission = {
  kind: RESOURCE.FLEET,
  verb: VERB.GET,
};

export const updateFleetPermission = {
  kind: RESOURCE.FLEET,
  verb: VERB.PATCH,
};

export const listwCatalogItemsPermission = {
  kind: RESOURCE.CATALOG_ITEM,
  verb: VERB.LIST,
};
