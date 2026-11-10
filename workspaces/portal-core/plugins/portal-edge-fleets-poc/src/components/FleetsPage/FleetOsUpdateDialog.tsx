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

import type { UseFleetUpdateState } from '../../hooks/useFleetUpdate';
import DescriptionList, {
  DescriptionListItem,
} from '../common/DescriptionList';

import styles from './FleetOsUpdateDialog.module.css';

// CELIA-WIP: check "Text as=strong" for correct style

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
  const { fleetName, targetOsLabel, maintenanceWindow } = updateRequest ?? {};

  return (
    <Dialog
      width="35rem"
      isOpen={Boolean(updateRequest)}
      isDismissable={!isUpdatingFleet}
      isKeyboardDismissDisabled={isUpdatingFleet}
      onOpenChange={handleFleetUpdateDialogOpen}
    >
      <DialogHeader>Update OS target</DialogHeader>
      <DialogBody className={styles.fleetOsUpdateDialogBody}>
        <Flex direction="column" gap="2">
          <Text>
            Set <Text as="strong">{fleetName}</Text> to target{' '}
            <Text as="strong">{targetOsLabel}</Text>.
          </Text>
          <Text color="secondary">
            {maintenanceWindow
              ? 'The fleet OS target updates immediately. Devices download and install during the next maintenance window.'
              : 'The fleet OS target updates immediately. Devices reconcile the new target as they connect — no maintenance window is set.'}
          </Text>
        </Flex>

        <section
          className={styles.fleetOsUpdateDialogSection}
          aria-label="OS target change"
        >
          <DescriptionList>
            <DescriptionListItem label="Current target">
              <Text weight="bold">current os</Text>
            </DescriptionListItem>
            <DescriptionListItem label="New target">
              <Text weight="bold">{targetOsLabel}</Text>
            </DescriptionListItem>
          </DescriptionList>
        </section>

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
                Update scheduling and maintenance windows are set and managed in
                Red Hat Edge Manager.
              </Text>
            </Flex>
            <DescriptionList>
              <DescriptionListItem label="Download">
                <Text>10:00 AM</Text>
              </DescriptionListItem>
              <DescriptionListItem label="Install">
                <Text>12:00 PM</Text>
              </DescriptionListItem>
            </DescriptionList>
          </Flex>
        </section>

        {updateError && (
          <Alert
            status="danger"
            title="Unable to update fleet"
            description={updateError}
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
