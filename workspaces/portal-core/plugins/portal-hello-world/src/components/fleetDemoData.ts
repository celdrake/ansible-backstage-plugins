import {
  ApiVersion,
  type Fleet,
  type FleetList,
} from '@ansible/portal-hello-world-common';

function createFleet(
  name: string,
  image: string,
  total: number,
  online: number,
  otherDeviceStatuses: Record<string, number>,
): Fleet {
  return {
    apiVersion: ApiVersion.ApiVersionV1beta1,
    kind: 'Fleet',
    metadata: { name },
    spec: {
      template: {
        spec: {
          os: { image },
        },
      },
    },
    status: {
      conditions: [],
      devicesSummary: {
        total,
        applicationStatus: {},
        summaryStatus: { Online: online, ...otherDeviceStatuses },
        updateStatus: {},
      },
    },
  };
}

/** FleetList-shaped fixtures based on the Flightctl v1beta1 response. */
export const FLEET_LIST: FleetList = {
  apiVersion: ApiVersion.ApiVersionV1beta1,
  kind: 'FleetList',
  metadata: {},
  items: [
    createFleet(
      'retail-terminals-us-east',
      'registry.example.test/rhel-edge:9.4.2',
      120,
      118,
      { PoweredOff: 2 },
    ),
    createFleet(
      'factory-floor-plant-a',
      'registry.example.test/rhel-edge:9.4.2',
      48,
      44,
      { Rebooting: 4 },
    ),
    createFleet(
      'oil-rig-sensors-gulf',
      'registry.example.test/rhel-edge:9.4.2',
      34,
      31,
      { AwaitingReconnect: 2, PoweredOff: 1 },
    ),
    createFleet(
      'branch-atms-west',
      'registry.example.test/rhel-edge:9.4.2',
      88,
      86,
      { PoweredOff: 2 },
    ),
    createFleet(
      'warehouse-kiosks-central',
      'registry.example.test/rhel-edge:9.4.2',
      22,
      22,
      {},
    ),
    createFleet(
      'lab-bench-custom-image',
      'registry.example.test/lab-edge:build-2026.09.18',
      8,
      6,
      { PoweredOff: 2 },
    ),
  ],
};
