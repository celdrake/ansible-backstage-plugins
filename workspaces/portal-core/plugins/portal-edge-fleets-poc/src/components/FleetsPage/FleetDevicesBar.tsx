import {
  DevicesSummary,
  DeviceSummaryStatusType,
  DeviceUpdatedStatusType,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import { Text } from '@backstage/ui';
import styles from './FleetDevicesBar.module.css';

const getDevicesUpdateBreakdown = (
  updateStatus: DevicesSummary['updateStatus'],
) => {
  const segments = [
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusUpToDate,
      label: 'Up to date',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusUpToDate] ?? 0,
      className: styles.fleetDevicesBarSegmentSuccess,
    },
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusUpdating,
      label: 'Updating',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusUpdating] ?? 0,
      className: styles.fleetDevicesBarSegmentInfo,
    },
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusOutOfDate,
      label: 'Out of date',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusOutOfDate] ?? 0,
      className: styles.fleetDevicesBarSegmentWarning,
    },
    {
      status: DeviceUpdatedStatusType.DeviceUpdatedStatusUnknown,
      label: 'Unknown',
      count:
        updateStatus[DeviceUpdatedStatusType.DeviceUpdatedStatusUnknown] ?? 0,
      className: styles.fleetDevicesBarSegmentUnknown,
    },
  ];
  return segments;
};

// CELIA-WIP: CONTENT NOT FITTING FOR 0 DEVICES TOTAL
const FleetDevicesBar = ({ fleet }: { fleet: Fleet }) => {
  const summary = fleet.status?.devicesSummary;
  if (!summary) {
    return 'Device status breakdown not available';
  }

  const segments = getDevicesUpdateBreakdown(summary.updateStatus);

  const onlineDevicesCount =
    summary.summaryStatus[DeviceSummaryStatusType.DeviceSummaryStatusOnline] ??
    0;
  return (
    <div className={styles.fleetDevicesBarWrapper}>
      <Text variant="body-small" weight="bold">
        {summary.total} devices
      </Text>
      <div className={styles.fleetDevicesBar}>
        {segments.map(({ status, label, count, className }) => (
          <div
            key={status}
            className={`${styles.fleetDevicesBarSegment} ${className}`}
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
      <Text variant="body-small" color="secondary">
        {`${onlineDevicesCount} online`}
      </Text>
    </div>
  );
};

export default FleetDevicesBar;
