export interface Config {
  ansible?: {
    'edge-fleets-poc'?: {
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
