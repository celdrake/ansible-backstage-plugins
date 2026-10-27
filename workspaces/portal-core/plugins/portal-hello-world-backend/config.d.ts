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
      flightctl?: {
        /** Base URL of the Flightctl API, including its exposed port. */
        apiBaseUrl?: string;
        /** Fixed Flightctl organization UUID for this PoC. */
        organizationId?: string;
        /** Skip TLS certificate verification for the local self-signed endpoint. */
        skipTlsVerify?: boolean;
      };
    };
  };
}
