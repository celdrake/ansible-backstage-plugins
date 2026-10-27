export interface Config {
  ansible?: {
    'hello-world'?: {
      aapApi?: {
        /** Base URL of the external application API. */
        apiBaseUrl?: string;
        /** Path appended to apiBaseUrl; defaults to /example. */
        apiPath?: string;
        /** Maps external AAP organization IDs to this API's internal IDs. */
        organizationMappings?: Array<{
          externalOrgId: string;
          internalOrgId: string;
        }>;
      };
    };
  };
}
