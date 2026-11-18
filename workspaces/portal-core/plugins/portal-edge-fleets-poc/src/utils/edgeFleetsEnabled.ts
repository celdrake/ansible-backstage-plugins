import type { ConfigApi } from '@backstage/core-plugin-api';

/** Enabled unless an operator explicitly turns the PoC pages off. */
export const isEdgeFleetsEnabled = (config: ConfigApi): boolean =>
  config.getOptionalBoolean('ansible.edge-fleets-poc.enabled') !== false;
