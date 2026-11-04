import { useCallback, useState } from 'react';
import type { Fleet } from '@ansible/portal-edge-fleets-poc-common';
import type { CatalogItemVersion } from '@ansible/portal-edge-fleets-poc-common/alpha';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

type FleetUpdateRequest = {
  fleetName: string;
  currentVersion: string;
  targetVersion: CatalogItemVersion;
};

const useFleetUpdate = (refetchFleets: VoidFunction) => {
  const flightctlFetch = useFlightCtlApiFetch();
  const [updateRequest, setUpdateRequest] = useState<FleetUpdateRequest>();
  const [updateError, setUpdateError] = useState<string>();
  const [updateSubmitted, setUpdateSubmitted] = useState(false);
  const [isUpdatingFleet, setIsUpdatingFleet] = useState(false);

  const openFleetUpdate = useCallback(
    (fleet: Fleet, targetVersion: CatalogItemVersion) => {
      setUpdateRequest({
        fleetName: fleet.metadata.name as string,
        currentVersion:
          fleet.spec.template.spec.os?.catalogItemRef?.version || '',
        targetVersion,
      });
      setUpdateError(undefined);
      setUpdateSubmitted(false);
    },
    [],
  );

  const closeFleetUpdate = useCallback(() => {
    if (isUpdatingFleet) {
      return;
    }
    setUpdateRequest(undefined);
    setUpdateError(undefined);
    setUpdateSubmitted(false);
  }, [isUpdatingFleet]);

  const confirmFleetUpdate = useCallback(async () => {
    if (!updateRequest) return;

    const fleetName = updateRequest.fleetName;
    const currentVersion = updateRequest.currentVersion;
    if (!fleetName || !currentVersion) {
      setUpdateError(
        'The fleet operating system catalog reference is unavailable.',
      );
      return;
    }

    setIsUpdatingFleet(true);
    setUpdateError(undefined);
    try {
      await flightctlFetch<void>(
        `/fleets/${encodeURIComponent(fleetName)}`,
        undefined,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json-patch+json' },
          body: JSON.stringify([
            {
              op: 'replace',
              path: '/spec/template/spec/os/catalogItemRef/version',
              value: updateRequest.targetVersion.version,
            },
          ]),
        },
      );
      refetchFleets();
      setUpdateSubmitted(true);
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : 'Unable to update fleet.',
      );
    } finally {
      setIsUpdatingFleet(false);
    }
  }, [updateRequest, flightctlFetch, refetchFleets]);

  const handleFleetUpdateDialogOpen = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeFleetUpdate();
      }
    },
    [closeFleetUpdate],
  );

  return {
    updateRequest,
    isUpdatingFleet,
    updateError,
    updateSubmitted,
    openFleetUpdate,
    closeFleetUpdate,
    confirmFleetUpdate,
    handleFleetUpdateDialogOpen,
  };
};

export default useFleetUpdate;
