import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Flex,
  Text,
} from '@backstage/ui';

import {
  DeviceUpdatePolicySpec,
  UpdateSchedule,
} from '@ansible/portal-edge-fleets-poc-common';
import type { UseFleetUpdateState } from '../../hooks/useFleetUpdate';
import { getOsCatalogItemDisplayText } from '../../utils/catalogItems';
import {
  extractUpdateScheduleParts,
  hasSameDownloadAndInstallSchedules,
} from '../../utils/updatePolicy';
import DescriptionList, {
  DescriptionListItem,
} from '../common/DescriptionList';

import styles from './FleetOsUpdateDialog.module.css';

// CELIA-WIP: check "Text as=strong" for correct style

const UpdateScheduleDetails = ({ schedule }: { schedule: UpdateSchedule }) => {
  const scheduleParts = extractUpdateScheduleParts(schedule);
  if (!scheduleParts) {
    return (
      <Flex direction="column" gap="1">
        <Text weight="bold">Custom schedule</Text>
        <Text variant="body-small" color="secondary">
          Cron expression:{' '}
          <code className={styles.fleetScheduleCronExpression}>
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
        <Text
          variant="body-small"
          color="secondary"
          className={styles.maintGrace}
        >
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
}: {
  updatePolicy: DeviceUpdatePolicySpec;
}) => {
  const hasSamePolicies = hasSameDownloadAndInstallSchedules(updatePolicy);
  const showInstallSchedule = updatePolicy?.updateSchedule && !hasSamePolicies;

  return (
    <Flex direction="column" gap="2">
      {updatePolicy?.downloadSchedule && (
        <>
          <Text weight="bold" variant="body-small">
            {hasSamePolicies ? 'Download and install' : 'Download'}
          </Text>
          <UpdateScheduleDetails schedule={updatePolicy.downloadSchedule} />
        </>
      )}
      {showInstallSchedule && (
        <div className={styles.fleetUpdateScheduleSeparator} />
      )}
      {showInstallSchedule && updatePolicy?.updateSchedule && (
        <>
          <Text weight="bold" variant="body-small">
            Install
          </Text>
          <UpdateScheduleDetails schedule={updatePolicy.updateSchedule} />
        </>
      )}
    </Flex>
  );
};

const getPrimaryButton = (
  title: string,
  onClick: VoidFunction,
  isDisabled: boolean,
) => {
  return (
    <Button variant="primary" onClick={onClick} isPending={isDisabled}>
      {title}
    </Button>
  );
};

const getSecondaryButton = (
  title: string,
  onClick: VoidFunction,
  isDisabled: boolean,
) => {
  return (
    <Button variant="secondary" onClick={onClick} isDisabled={isDisabled}>
      {title}
    </Button>
  );
};

const FleetOsUpdateFooterActions = ({
  hasUpdateError,
  isSubmitting,
  isSubmitSuccess,
  onSubmit,
  onCancel,
}: {
  hasUpdateError: boolean;
  isSubmitting: boolean;
  isSubmitSuccess: boolean;
  onSubmit: VoidFunction;
  onCancel: VoidFunction;
}) => {
  if (isSubmitSuccess) {
    return (
      <Button variant="primary" onClick={onCancel}>
        Close
      </Button>
    );
  }
  if (hasUpdateError) {
    return (
      <>
        <Button variant="secondary" onClick={onSubmit}>
          Retry set OS target
        </Button>
        <Button variant="primary" onClick={onCancel}>
          Close
        </Button>
      </>
    );
  }
  return (
    <>
      <Button variant="secondary" onClick={onCancel} isDisabled={isSubmitting}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onSubmit} isPending={isSubmitting}>
        Set OS target
      </Button>
    </>
  );
};

const FleetOsUpdateDialog = ({
  fleetUpdateState,
}: {
  fleetUpdateState: UseFleetUpdateState;
}) => {
  const {
    updateRequest,
    isSubmitting,
    updateError,
    isSubmitSuccess,
    closeFleetUpdate,
    confirmFleetUpdate,
    handleFleetUpdateDialogOpen,
  } = fleetUpdateState;

  if (!updateRequest) {
    return null;
  }

  const { fleet, osCatalogItem, targetVersion } = updateRequest;
  const fleetName = fleet?.metadata.name as string;
  const updatePolicy = fleet?.spec.template.spec.updatePolicy;
  const hasUpdatePolicy =
    updatePolicy &&
    Boolean(updatePolicy?.downloadSchedule || updatePolicy?.updateSchedule);

  const currentOsLabel = getOsCatalogItemDisplayText(
    osCatalogItem,
    fleet.spec.template.spec.os?.catalogItemRef?.version || '',
  );
  const targetOsLabel = getOsCatalogItemDisplayText(
    osCatalogItem,
    targetVersion.version,
  );

  return (
    <Dialog
      width="35rem"
      isOpen
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      onOpenChange={handleFleetUpdateDialogOpen}
    >
      <DialogHeader className={styles.fleetOsUpdateDialogHeader}>
        Update OS target
      </DialogHeader>
      <DialogBody className={styles.fleetOsUpdateDialogBody}>
        {updateError && (
          <Alert
            status="danger"
            title="Couldn't update OS target"
            description={
              <div>
                Something went wrong while setting the fleet OS target. Try
                again, or open Edge Manager if the problem continues.
                <details>{updateError}</details>
              </div>
            }
            mt="3"
          />
        )}
        {isSubmitSuccess ? (
          <Alert
            status="success"
            title="OS target updated"
            description={`${fleetName} now targets ${targetOsLabel}.`}
            icon
            mt="3"
          />
        ) : (
          <Flex direction="column" gap="2">
            <Text>
              Set <Text as="strong">{fleetName}</Text> to target{' '}
              <Text as="strong">{targetOsLabel}</Text>.
            </Text>
            <Text color="secondary">
              {hasUpdatePolicy
                ? 'The fleet OS target updates immediately. Devices download and install during the next maintenance window.'
                : 'The fleet OS target updates immediately. Devices reconcile the new target as they connect - no maintenance window is set.'}
            </Text>
          </Flex>
        )}

        <section
          className={styles.fleetOsUpdateDialogSection}
          aria-label="OS target change"
        >
          <DescriptionList>
            <DescriptionListItem label="Current target">
              <Text weight="bold">
                {isSubmitSuccess ? targetOsLabel : currentOsLabel}
              </Text>
            </DescriptionListItem>
            {!isSubmitSuccess && (
              <DescriptionListItem label="New target">
                <Text weight="bold">{targetOsLabel}</Text>
              </DescriptionListItem>
            )}
          </DescriptionList>
        </section>

        {hasUpdatePolicy && !updateError && !isSubmitting && (
          <section
            className={styles.fleetOsUpdateDialogSection}
            aria-label="Maintenance window"
          >
            <Flex direction="column" gap="4">
              <Flex direction="column" gap="1">
                <Text id="update-os-window" weight="bold">
                  Maintenance window
                </Text>
                <Text variant="body-small" color="secondary">
                  Update scheduling and maintenance windows are set and managed
                  in Red Hat Edge Manager.
                </Text>
              </Flex>
              <FleetUpdatePolicyDetails updatePolicy={updatePolicy} />
            </Flex>
          </section>
        )}
      </DialogBody>
      <DialogFooter>
        <FleetOsUpdateFooterActions
          hasUpdateError={!!updateError}
          isSubmitting={isSubmitting}
          isSubmitSuccess={isSubmitSuccess}
          onSubmit={confirmFleetUpdate}
          onCancel={closeFleetUpdate}
        />
      </DialogFooter>
    </Dialog>
  );
};

export default FleetOsUpdateDialog;
