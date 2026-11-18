export interface Config {
  ansible?: {
    'edge-fleets-poc'?: {
      /** Hide the Edge Fleets pages without uninstalling the plugin.
       * Defaults to enabled.
       * @visibility frontend
       */
      enabled?: boolean;
    };
  };
}
