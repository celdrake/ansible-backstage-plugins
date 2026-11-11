import { Text } from '@backstage/ui';

import {
  DeviceSummaryStatusType,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import { RiHardDrive3Line } from '@remixicon/react';
import DefaultEmptyState from '../common/DefaultEmptyState';
import FleetDevicesBar from '../FleetsPage/FleetDevicesBar';
import styles from './FleetUpdateStatusDetail.module.css';

const FleetUpdateStatusDetail = ({ fleet }: { fleet: Fleet }) => {
  const devicesSummary = fleet.status?.devicesSummary;
  if (!devicesSummary) {
    return 'Device mix not available for this fleet';
  }
  if (devicesSummary.total === 0) {
    return (
      <DefaultEmptyState
        icon={<RiHardDrive3Line size={28} />}
        title="No devices in this fleet yet"
        description="Assign devices to this fleet to see their status."
      />
    );
  }
  const onlineCount =
    devicesSummary.summaryStatus[
      DeviceSummaryStatusType.DeviceSummaryStatusOnline
    ] || 0;
  return (
    <>
      <div className={styles.statPair}>
        <div className={styles.statBlock}>
          <Text
            variant="title-medium"
            weight="bold"
            className={styles.statValue}
          >
            {devicesSummary.total || '0'}
          </Text>
          <Text variant="body-small" color="secondary">
            Total
          </Text>
        </div>
        <div className={styles.statBlock}>
          <Text
            variant="title-medium"
            weight="bold"
            className={styles.statValue}
          >
            {onlineCount || '0'}
          </Text>
          <Text variant="body-small" color="secondary">
            Online
          </Text>
        </div>
      </div>
      <div className={styles.rolloutBlock}>
        <FleetDevicesBar
          fleet={fleet}
          header={
            <Text variant="body-small" color="secondary">
              vs the fleet's configuration
            </Text>
          }
        />
        <br />
        <Text variant="body-small" color="secondary">
          Shows how many devices match the fleet's configuration, are updating
          toward it, or are out of date.
        </Text>
      </div>
    </>
  );
};

export default FleetUpdateStatusDetail;
