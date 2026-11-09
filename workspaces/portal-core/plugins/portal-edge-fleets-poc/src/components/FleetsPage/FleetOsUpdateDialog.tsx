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
      isOpen={Boolean(updateRequest)}
      isDismissable={!isUpdatingFleet}
      isKeyboardDismissDisabled={isUpdatingFleet}
      onOpenChange={handleFleetUpdateDialogOpen}
    >
      <DialogHeader>Update OS target</DialogHeader>
      <DialogBody>
        <Flex direction="column" gap="4">
          <Text variant="body-medium">
            Set <strong>{fleetName}</strong> to target{' '}
            <strong>{targetOsLabel}</strong>.
          </Text>
          {!updateSubmitted && (
            <Alert
              status="info"
              title="Install timing"
              description={
                maintenanceWindow
                  ? `Fleet spec updates now. Devices keep their current configuration until the next maintenance window (${maintenanceWindow}), when pending fleet changes can roll out. Managed in Red Hat Edge Manager.`
                  : 'No maintenance window is set. Fleet spec updates now and devices reconcile the new OS target immediately as they connect.'
              }
            />
          )}
        </Flex>
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
