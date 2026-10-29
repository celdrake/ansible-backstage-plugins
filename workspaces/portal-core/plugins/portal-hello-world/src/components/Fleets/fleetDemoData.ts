import {
  ApiVersion,
  ConditionStatus,
  ConditionType,
  type Condition,
  type Fleet,
  type FleetList,
  type DeviceOsSpec,
} from '@ansible/portal-hello-world-common';

const createCondition = (
  type: ConditionType,
  status: ConditionStatus,
  reason: string,
  message: string,
): Condition => ({
  type,
  status,
  lastTransitionTime: '2026-10-29T12:00:00Z',
  reason,
  message,
});

function createFleet(
  name: string,
  osSpec: DeviceOsSpec,
  total: number,
  online: number,
  otherDeviceStatuses: Record<string, number>,
  conditions: Condition[],
): Fleet {
  return {
    apiVersion: ApiVersion.ApiVersionV1beta1,
    kind: 'Fleet',
    metadata: { name },
    spec: {
      template: {
        spec: { os: osSpec },
      },
    },
    status: {
      conditions,
      devicesSummary: {
        total,
        applicationStatus: {},
        summaryStatus: { Online: online, ...otherDeviceStatuses },
        updateStatus: {},
      },
    },
  };
}

export const FLEET_LIST: FleetList = {
  apiVersion: ApiVersion.ApiVersionV1beta1,
  kind: 'FleetList',
  metadata: {},
  items: [
    createFleet(
      'retail-terminals-us-east',
      {
        catalogItemRef: {
          catalog: 'test-catalog',
          item: 'rhel-edge',
          version: '9.4.2',
        },
      },
      120,
      118,
      { PoweredOff: 2 },
      [
        createCondition(
          ConditionType.FleetValid,
          ConditionStatus.ConditionStatusTrue,
          'FleetValidated',
          'Fleet configuration is valid.',
        ),
      ],
    ),
    createFleet(
      'factory-floor-plant-a',
      {
        catalogItemRef: {
          catalog: 'test-catalog',
          item: 'rhel-edge',
          version: '9.4.0',
        },
      },
      48,
      44,
      { Rebooting: 4 },
      [
        createCondition(
          ConditionType.FleetValid,
          ConditionStatus.ConditionStatusTrue,
          'FleetValidated',
          'Fleet configuration is valid.',
        ),
        createCondition(
          ConditionType.FleetRolloutInProgress,
          ConditionStatus.ConditionStatusTrue,
          'RolloutInProgress',
          'A configuration rollout is in progress.',
        ),
      ],
    ),
    createFleet(
      'oil-rig-sensors-gulf',
      {
        catalogItemRef: {
          catalog: 'demo-catalog',
          item: 'edge-os',
          version: '6.4.0',
        },
      },
      34,
      31,
      { AwaitingReconnect: 2, PoweredOff: 1 },
      [
        createCondition(
          ConditionType.FleetValid,
          ConditionStatus.ConditionStatusTrue,
          'FleetValidated',
          'Fleet configuration is valid.',
        ),
        createCondition(
          ConditionType.FleetDeltaPreparing,
          ConditionStatus.ConditionStatusTrue,
          'DeltaArtifactsPreparing',
          'Delta artifacts are being generated.',
        ),
      ],
    ),
    createFleet(
      'branch-atms-west',
      { image: 'registry.example.test/rhel-edge:9.4.2' },
      88,
      86,
      { PoweredOff: 2 },
      [
        createCondition(
          ConditionType.FleetValid,
          ConditionStatus.ConditionStatusFalse,
          'InvalidFleetConfiguration',
          'The fleet configuration needs attention.',
        ),
      ],
    ),
    createFleet(
      'lab-bench-custom-image',
      { image: 'registry.example.test/lab-edge:build-2026.09.18' },
      8,
      6,
      { PoweredOff: 2 },
      [
        createCondition(
          ConditionType.FleetValid,
          ConditionStatus.ConditionStatusUnknown,
          'FleetSyncPending',
          'Fleet status has not synchronized yet.',
        ),
      ],
    ),
  ],
};
