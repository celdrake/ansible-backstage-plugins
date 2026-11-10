import { Text } from '@backstage/ui';

import {
  DeviceSummaryStatusType,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import FleetDevicesBar from '../FleetsPage/FleetDevicesBar';
import styles from './FleetUpdateStatusDetail.module.css';

const FleetUpdateStatusDetail = ({ fleet }: { fleet: Fleet }) => {
  const devicesSummary = fleet.status?.devicesSummary;
  if (!devicesSummary) {
    return 'Device mix not available for this fleet';
  }
  const updatedStatus = devicesSummary.updateStatus;
  const summaryStatus = devicesSummary.summaryStatus;
  return (
    <>
      <div className={styles.statPair}>
        <div className={styles.statBlock}>
          <Text as="strong" variant="title-medium" className={styles.statValue}>
            {devicesSummary.total || '0'}
          </Text>
          <Text variant="body-small" color="secondary">
            Total
          </Text>
        </div>
        <div className={styles.statBlock}>
          <Text as="strong" variant="title-medium" className={styles.statValue}>
            {summaryStatus[DeviceSummaryStatusType.DeviceSummaryStatusOnline] ||
              '0'}
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
              Goal - discuss with UX
            </Text>
          }
        />
        PROGRESS BAR ROLLOUT NOTE
      </div>
    </>
  );
};

export default FleetUpdateStatusDetail;
