import {
  ConditionStatus,
  ConditionType,
  FleetStatus as ApiFleetStatus,
} from '@ansible/portal-edge-fleets-poc-common';
import { Flex, Text } from '@backstage/ui';

import { statusColorStyles, type StatusLevel } from '../../styles';

export type FleetStatusType =
  | ConditionType.FleetValid
  | 'Invalid'
  | 'SyncPending';

type FleetStatusItem = {
  id: FleetStatusType;
  level: StatusLevel;
  label: string;
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
      label: 'Fleet is invalid',
    };
  }
  return {
    id: ConditionType.FleetValid,
    level: 'success',
    label: 'Fleet is valid',
  };
};

const FleetStatus = ({ fleetStatus }: { fleetStatus?: ApiFleetStatus }) => {
  const fleetStatusItem = getFleetStatusItem(fleetStatus);

  //       <span className={`${styles.statusDot} ${DOT[status.tone]}`} aria-hidden />

  const statusLevel = fleetStatusItem.level;
  return (
    <Flex style={statusColorStyles[statusLevel]} gap="2">
      <Text variant="body-medium" weight="bold" color={statusLevel}>
        {fleetStatusItem.label}
      </Text>
    </Flex>
  );
};

export default FleetStatus;
