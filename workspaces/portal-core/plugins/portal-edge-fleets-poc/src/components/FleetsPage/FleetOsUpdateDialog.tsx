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
  formatUpdateSchedule,
  hasSameDownloadAndInstallSchedules,
} from '../../utils/updatePolicy';
import DescriptionList, {
  DescriptionListItem,
} from '../common/DescriptionList';

import styles from './FleetOsUpdateDialog.module.css';

// CELIA-WIP: check "Text as=strong" for correct style

const UpdateScheduleDetails = ({
  title,
  scheduleText,
  atExpression,
}: {
  title: string;
  scheduleText: string | null;
  atExpression: string;
}) => {
  if (!scheduleText) {
    return (
      <>
        <DescriptionListItem label={`${title}`}>
          <Text>{`Cron schedule: ${atExpression}`}</Text>
        </DescriptionListItem>
        <DescriptionListItem label="Note">
          <Text>Complex schedules are managed in Edge Manager.</Text>
        </DescriptionListItem>
      </>
    );
  }

  return (
    <DescriptionListItem label={title}>
      <Text>{scheduleText}</Text>
    </DescriptionListItem>
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
    <DescriptionList>
      {updatePolicy?.downloadSchedule && (
        <UpdateScheduleDetails
          title={hasSamePolicies ? 'Download and install' : 'Download'}
          scheduleText={formatUpdateSchedule(updatePolicy.downloadSchedule)}
          atExpression={updatePolicy.downloadSchedule.at}
        />
      )}
      {showInstallSchedule && updatePolicy?.updateSchedule && (
        <UpdateScheduleDetails
          title="Install"
          scheduleText={formatUpdateSchedule(updatePolicy.updateSchedule)}
          atExpression={updatePolicy.updateSchedule.at}
        />
      )}
    </DescriptionList>
  );
};

const FleetOsUpdateDialog = ({
  fleetUpdateState,
}: {
  fleetUpdateState: UseFleetUpdateState;
}) => {
  const {
    updateRequest,
    isUpdatingFleet,
    updateError,
    updateSubmitted,
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

  const targetOsLabel = getOsCatalogItemDisplayText(
    osCatalogItem,
    targetVersion.version,
  );

  return (
    <Dialog
      width="35rem"
      isOpen
      isDismissable={!isUpdatingFleet}
      isKeyboardDismissDisabled={isUpdatingFleet}
      onOpenChange={handleFleetUpdateDialogOpen}
    >
      <DialogHeader className={styles.fleetOsUpdateDialogHeader}>
        Update OS target
      </DialogHeader>
      <DialogBody className={styles.fleetOsUpdateDialogBody}>
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

        <section
          className={styles.fleetOsUpdateDialogSection}
          aria-label="OS target change"
        >
          <DescriptionList>
            <DescriptionListItem label="Current target">
              <Text weight="bold">
                {getOsCatalogItemDisplayText(
                  osCatalogItem,
                  fleet.spec.template.spec.os?.catalogItemRef?.version || '',
                )}
              </Text>
            </DescriptionListItem>
            <DescriptionListItem label="New target">
              <Text weight="bold">{targetOsLabel}</Text>
            </DescriptionListItem>
          </DescriptionList>
        </section>

        {hasUpdatePolicy && (
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

        {updateError && (
          <Alert
            status="danger"
            title="OS target could not be updated"
            description={
              <div>
                The OS target for this fleet could not be updated. See the
                details below and try again.
                <details>{updateError}</details>
              </div>
            }
            icon
            mt="3"
          />
        )}
        {updateSubmitted && (
          <Alert
            status="success"
            title="Fleet updated successfully"
            description={`Fleet ${fleetName} was updated to target OS ${targetOsLabel}.`}
            icon
            mt="3"
          />
        )}
      </DialogBody>
      <DialogFooter>
        {updateSubmitted ? (
          <Button variant="primary" onClick={closeFleetUpdate}>
            Close
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={closeFleetUpdate}
              isDisabled={isUpdatingFleet}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmFleetUpdate}
              isPending={isUpdatingFleet}
            >
              Set OS target
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
};

export default FleetOsUpdateDialog;
