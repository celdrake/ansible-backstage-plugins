import {
  ConditionStatus,
  ConditionType,
  FleetStatus as ApiFleetStatus,
} from '@ansible/portal-edge-fleets-poc-common';
import { Flex, Text } from '@backstage/ui';

import { type StatusLevel } from '../../styles';
import styles from './FleetStatus.module.css';

export type FleetStatusType =
  | ConditionType.FleetValid
  | 'Invalid'
  | 'SyncPending';

type FleetStatusItem = {
  id: FleetStatusType;
  level: StatusLevel;
  label: string;
};

const MarkerStyles: Record<StatusLevel, string> = {
  success: styles.fleetStatusMarkerSuccess,
  danger: styles.fleetStatusMarkerDanger,
  warning: styles.fleetStatusMarkerWarning,
  info: styles.fleetStatusMarkerInfo,
};

const getFleetStatusItem = (fleetStatus?: ApiFleetStatus): FleetStatusItem => {
  const fleetConditions = fleetStatus?.conditions ?? [];

  const validCondition = fleetConditions.find(
    c => c.type === ConditionType.FleetValid,
  );

  if (
    !validCondition ||
    validCondition?.status === ConditionStatus.ConditionStatusUnknown
  ) {
    return {
      id: 'SyncPending',
      level: 'info',
      label: 'Sync pending',
    };
  } else if (validCondition.status === ConditionStatus.ConditionStatusFalse) {
    return {
      id: 'Invalid',
      level: 'danger',
      label: 'Invalid',
    };
  }
  return {
    id: ConditionType.FleetValid,
    level: 'success',
    label: 'Valid',
  };
};

const FleetStatus = ({ fleetStatus }: { fleetStatus?: ApiFleetStatus }) => {
  const fleetStatusItem = getFleetStatusItem(fleetStatus);

  const statusLevel = fleetStatusItem.level;
  return (
    <Flex className={styles.fleetStatusWrapper} gap="2">
      <span
        className={`${styles.fleetStatusMarker} ${MarkerStyles[statusLevel]}`}
      />
      <Text variant="body-medium" weight="bold" color={statusLevel}>
        {fleetStatusItem.label}
      </Text>
    </Flex>
  );
};

export default FleetStatus;
