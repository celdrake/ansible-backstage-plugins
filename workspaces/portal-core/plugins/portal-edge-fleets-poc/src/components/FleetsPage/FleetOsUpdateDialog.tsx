import * as React from 'react';
import {
  Alert,
  Box,
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
  const fleetName = updateRequest?.fleetName ?? '';
  const currentVersion = updateRequest?.currentVersion ?? 'unknown';
  return (
    <Dialog
      isOpen={Boolean(updateRequest)}
      isDismissable={!isUpdatingFleet}
      isKeyboardDismissDisabled={isUpdatingFleet}
      onOpenChange={handleFleetUpdateDialogOpen}
    >
      <DialogHeader>Confirm fleet update</DialogHeader>
      <DialogBody>
        <Text variant="body-medium">
          Update the operating system for fleet <strong>{fleetName}</strong>?
        </Text>
        <Box mt="3">
          <Text variant="body-small" color="secondary">
            Upgrade path
          </Text>
          <Flex align="center" gap="2">
            <Text variant="body-medium">{currentVersion}</Text>
            <span aria-hidden="true">→</span>
            <Text variant="body-medium">
              {updateRequest?.targetVersion.version}
            </Text>
          </Flex>
        </Box>
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
            title="Fleet update requested"
            description={`Fleet ${fleetName} is configured to update to version ${updateRequest?.targetVersion.version}.`}
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
              Confirm update
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
};

export default FleetOsUpdateDialog;
