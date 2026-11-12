import { Flex, Text } from '@backstage/ui';
import {
  DeviceUpdatePolicySpec,
  UpdateSchedule,
} from '@ansible/portal-edge-fleets-poc-common';
import {
  extractUpdateScheduleParts,
  hasSameDownloadAndInstallSchedules,
} from '../../utils/updatePolicy';
import DescriptionList, { DescriptionListItem } from './DescriptionList';

import styles from './FleetUpdatePolicyDetails.module.css';

const UpdateScheduleDetails = ({ schedule }: { schedule: UpdateSchedule }) => {
  const scheduleParts = extractUpdateScheduleParts(schedule);
  if (!scheduleParts) {
    return (
      <Flex direction="column" gap="1">
        <Text weight="bold">Custom schedule</Text>
        <Text variant="body-small" color="secondary">
          Cron expression:{' '}
          <code className={styles.fleetUpdatePolicyCronExpression}>
            {schedule.at}
          </code>
        </Text>
        <Text variant="body-small" color="secondary">
          This expression can't be summarized here. Open Edge Manager for full
          details and edits.
        </Text>
      </Flex>
    );
  }

  return (
    <DescriptionList>
      <DescriptionListItem label="Frequency">
        <Text weight="bold" variant="body-small">
          {scheduleParts.frequency}
        </Text>
      </DescriptionListItem>
      <DescriptionListItem label="Days">
        <Text weight="bold" variant="body-small">
          {scheduleParts.daysOfWeek.join(', ')}
        </Text>
      </DescriptionListItem>
      <DescriptionListItem label="Time">
        <Text weight="bold" variant="body-small">
          {scheduleParts.time}
        </Text>
        <br />
        <Text variant="body-small" color="secondary">
          Start grace {schedule.startGraceDuration}
        </Text>
      </DescriptionListItem>
      <DescriptionListItem label="Timezone">
        <Text variant="body-small">
          {scheduleParts.isLocalTimeZone
            ? "Device's local timezone"
            : schedule.timeZone}
        </Text>
      </DescriptionListItem>
    </DescriptionList>
  );
};

const FleetUpdatePolicyDetails = ({
  updatePolicy,
  asSeparateBlocks: asSeparateBlocks = false,
}: {
  updatePolicy: DeviceUpdatePolicySpec;
  asSeparateBlocks?: boolean;
}) => {
  const hasSamePolicies = hasSameDownloadAndInstallSchedules(updatePolicy);
  const showInstallSchedule = updatePolicy?.updateSchedule && !hasSamePolicies;

  return (
    <Flex
      direction="column"
      gap="2"
      className={styles.fleetUpdatePolicySchedule}
    >
      {updatePolicy?.downloadSchedule && (
        <div
          className={
            asSeparateBlocks ? styles.fleetUpdatePolicyScheduleFilled : ''
          }
        >
          <Text weight="bold" variant="body-small">
            {hasSamePolicies ? 'Download and install' : 'Download'}
          </Text>
          <UpdateScheduleDetails schedule={updatePolicy.downloadSchedule} />
        </div>
      )}
      {showInstallSchedule && !asSeparateBlocks && (
        <div className={styles.fleetUpdatePolicySeparator} />
      )}
      {showInstallSchedule && updatePolicy?.updateSchedule && (
        <div
          className={
            asSeparateBlocks ? styles.fleetUpdatePolicyScheduleFilled : ''
          }
        >
          <Text weight="bold" variant="body-small">
            Install
          </Text>
          <UpdateScheduleDetails schedule={updatePolicy.updateSchedule} />
        </div>
      )}
    </Flex>
  );
};

export default FleetUpdatePolicyDetails;
