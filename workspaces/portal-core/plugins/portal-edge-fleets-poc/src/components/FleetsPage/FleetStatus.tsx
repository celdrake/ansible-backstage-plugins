import {
  Condition,
  ConditionStatus,
  ConditionType,
  FleetStatus as ApiFleetStatus,
} from '@ansible/portal-edge-fleets-poc-common';
import { Flex } from '@backstage/ui';
import SvgIcon from '@mui/material/SvgIcon';
import PendingIcon from '@mui/icons-material/Pending';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import { statusColorStyles, type StatusLevel } from '../../styles';

export type FleetStatusType =
  | ConditionType.FleetValid
  | ConditionType.FleetRolloutInProgress
  | ConditionType.FleetDeltaPreparing
  | 'Invalid'
  | 'SyncPending';

// CELIA-WIP: Use the common getCondition function.

// CELIA-WIP: do we want to show any info message in the status?

const getCondition = (
  conditions: Condition[] | undefined,
  type: ConditionType | FleetStatusType,
  status: ConditionStatus = ConditionStatus.ConditionStatusTrue,
): Condition | undefined => {
  const typeCond = conditions?.filter(c => c.type === type);
  if (typeCond) {
    return typeCond.find(tc => tc.status === status);
  }
  return undefined;
};

type FleetStatusItem = {
  id: FleetStatusType;
  level: StatusLevel;
  label: string;
  iconClass: typeof SvgIcon;
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
      iconClass: PendingIcon,
    };
  } else if (validCondition.status === ConditionStatus.ConditionStatusFalse) {
    return {
      id: 'Invalid',
      level: 'danger',
      label: 'Fleet is invalid',
      iconClass: ErrorIcon,
    };
  }

  const rolloutCondition = getCondition(
    fleetConditions,
    ConditionType.FleetRolloutInProgress,
  );
  if (
    rolloutCondition &&
    rolloutCondition.status === ConditionStatus.ConditionStatusTrue
  ) {
    return {
      id: ConditionType.FleetRolloutInProgress,
      level: 'info',
      label: 'Fleet rollout in progress',
      iconClass: SyncIcon,
    };
  }

  const deltaUpdatesCondition = getCondition(
    fleetConditions,
    ConditionType.FleetDeltaPreparing,
  );
  if (deltaUpdatesCondition) {
    return {
      id: ConditionType.FleetDeltaPreparing,
      level: 'info',
      label: 'Generating delta artifacts',
      iconClass: SyncIcon,
    };
  }

  return {
    id: ConditionType.FleetValid,
    level: 'success',
    label: 'Fleet is valid',
    iconClass: CheckCircleIcon,
  };
};

const FleetStatus = ({ fleetStatus }: { fleetStatus?: ApiFleetStatus }) => {
  const fleetStatusItem = getFleetStatusItem(fleetStatus);
  const IconComponent = fleetStatusItem.iconClass;

  return (
    <Flex style={statusColorStyles[fleetStatusItem.level]} gap="2">
      <IconComponent style={{ fontSize: 20 }} />
      {fleetStatusItem.label}
    </Flex>
  );
};

export default FleetStatus;
