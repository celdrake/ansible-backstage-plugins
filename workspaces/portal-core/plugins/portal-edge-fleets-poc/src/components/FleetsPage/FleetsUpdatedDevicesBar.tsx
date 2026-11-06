import {
  DevicesSummary,
  DeviceUpdatedStatusType,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import { Text } from '@backstage/ui';
import styles from './FleetsUpdatedDevicesBar.module.css';

const getDevicesUpdateBreakdown = (
  updateStatus: DevicesSummary['updateStatus'],
) => {
  const segments = [
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusUpToDate,
      label: 'Up to date',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusUpToDate] ?? 0,
      className: styles.fleetUpdatedDevicesBarSegmentSuccess,
    },
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusUpdating,
      label: 'Updating',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusUpdating] ?? 0,
      className: styles.fleetUpdatedDevicesBarSegmentInfo,
    },
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusOutOfDate,
      label: 'Out of date',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusOutOfDate] ?? 0,
      className: styles.fleetUpdatedDevicesBarSegmentWarning,
    },
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusUnknown,
      label: 'Unknown',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusUnknown] ?? 0,
      className: styles.fleetUpdatedDevicesBarSegmentNeutral,
    },
  ];
  return segments;
};

const FleetsUpdatedDevicesBar = ({ fleet }: { fleet: Fleet }) => {
  const summary = fleet.status?.devicesSummary;
  if (!summary) {
    // CELIA-WIP: Discuss the UX for a missing addDevicesSummary response.
    return 'Device status breakdown not available';
  }

  const segments = getDevicesUpdateBreakdown(summary.updateStatus);

  const statusDescription = segments
    .map(({ count, label }) => `${count} ${label.toLowerCase()}`)
    .join(', ');

  return (
    <div className={styles.fleetUpdatedDevicesBarWrapper}>
      <div
        className={styles.fleetUpdatedDevicesBar}
        role="img"
        aria-label={statusDescription}
      >
        {segments.map(({ status, label, count, className }) => (
          <div
            key={status}
            className={`${styles.fleetUpdatedDevicesBarSegment} ${className}`}
            style={{
              width: `${(count / (summary.total || 1)) * 100}%`,
            }}
            aria-label={`${count} ${label.toLowerCase()}`}
          />
        ))}
      </div>
      <div className={styles.fleetDevicesProgressCounts}>
        {segments.map(({ status, label, count, className }) => (
          <span key={status} className={styles.fleetDevicesCountItem}>
            <span
              className={`${styles.fleetDevicesSwatch} ${className}`}
              aria-hidden="true"
            />
            <Text variant="body-small" weight="bold">
              {count}
            </Text>
            <Text variant="body-small" color="secondary">
              {label}
            </Text>
          </span>
        ))}
      </div>
    </div>
  );
};

export default FleetsUpdatedDevicesBar;
