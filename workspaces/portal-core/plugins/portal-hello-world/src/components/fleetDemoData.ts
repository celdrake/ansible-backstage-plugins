export type EdgeOsSource = 'managed' | 'manual';

export type EdgeUpdateState =
  | 'up-to-date'
  | 'available'
  | 'scheduled'
  | 'updating';

export type EdgeFleet = {
  id: string;
  name: string;
  description: string;
  devicesOnline: number;
  devicesTotal: number;
  osSource: EdgeOsSource;
  osLabel: string;
  currentVersion: string;
  availableVersion?: string;
  osUpdateState: EdgeUpdateState;
  osRolloutProgress?: string;
};

export const EDGE_FLEETS: EdgeFleet[] = [
  {
    id: 'fleet-retail-east',
    name: 'Retail terminals — US East',
    description:
      'Point-of-sale terminals across US East Coast retail locations.',
    devicesOnline: 118,
    devicesTotal: 120,
    osSource: 'managed',
    osLabel: 'RHEL Edge',
    currentVersion: '9.4.2',
    osUpdateState: 'up-to-date',
  },
  {
    id: 'fleet-factory-a',
    name: 'Factory floor — Plant A',
    description:
      'Industrial controllers and HMIs on the Plant A factory floor.',
    devicesOnline: 44,
    devicesTotal: 48,
    osSource: 'managed',
    osLabel: 'RHEL Edge',
    currentVersion: '9.4.1',
    availableVersion: '9.4.2',
    osUpdateState: 'updating',
    osRolloutProgress: '12 of 48 devices updated',
  },
  {
    id: 'fleet-oil-gulf',
    name: 'Oil rig sensors — Gulf',
    description: 'Remote telemetry sensors on Gulf of Mexico platforms.',
    devicesOnline: 31,
    devicesTotal: 34,
    osSource: 'managed',
    osLabel: 'RHEL Edge',
    currentVersion: '9.3.4',
    availableVersion: '9.4.2',
    osUpdateState: 'available',
  },
  {
    id: 'fleet-branch-west',
    name: 'Branch ATMs — West',
    description: 'ATM and teller edge nodes across West Coast branches.',
    devicesOnline: 86,
    devicesTotal: 88,
    osSource: 'managed',
    osLabel: 'RHEL Edge',
    currentVersion: '9.4.1',
    availableVersion: '9.4.2',
    osUpdateState: 'available',
  },
  {
    id: 'fleet-warehouse',
    name: 'Warehouse kiosks — Central',
    description: 'Inventory kiosks in central warehouse facilities.',
    devicesOnline: 22,
    devicesTotal: 22,
    osSource: 'managed',
    osLabel: 'RHEL Edge',
    currentVersion: '9.4.2',
    osUpdateState: 'up-to-date',
  },
  {
    id: 'fleet-lab-bench',
    name: 'Lab bench — custom image',
    description: 'Engineering lab devices pinned to a custom OS image.',
    devicesOnline: 6,
    devicesTotal: 8,
    osSource: 'manual',
    osLabel: 'Custom image',
    currentVersion: 'build-2026.08.12',
    availableVersion: 'build-2026.09.18',
    osUpdateState: 'available',
  },
];
