import { useCallback, useState } from 'react';
import type { Fleet } from '@ansible/portal-edge-fleets-poc-common';
import type {
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-edge-fleets-poc-common/alpha';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

type FleetUpdateRequest = {
  fleet: Fleet;
  osCatalogItem: CatalogItem;
  targetVersion: CatalogItemVersion;
};

export type UseFleetUpdateState = {
  updateRequest: FleetUpdateRequest | undefined;
  isSubmitting: boolean;
  isSubmitSuccess: boolean;
  updateError: string | undefined;
  openFleetUpdate: (
    fleet: Fleet,
    osCatalogItem: CatalogItem,
    targetVersion: CatalogItemVersion,
  ) => void;
  closeFleetUpdate: VoidFunction;
  confirmFleetUpdate: VoidFunction;
  handleFleetUpdateDialogOpen: (isOpen: boolean) => void;
};

const useFleetUpdate = (refetchFleets: VoidFunction): UseFleetUpdateState => {
  const flightctlFetch = useFlightCtlApiFetch();
  const [updateRequest, setUpdateRequest] = useState<FleetUpdateRequest>();
  const [updateError, setUpdateError] = useState<string>();
  const [isSubmitSuccess, setisSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openFleetUpdate = useCallback(
    (
      fleet: Fleet,
      osCatalogItem: CatalogItem,
      targetVersion: CatalogItemVersion,
    ) => {
      setUpdateRequest({
        fleet,
        osCatalogItem,
        targetVersion,
      });
      setUpdateError(undefined);
      setisSubmitSuccess(false);
    },
    [],
  );

  const closeFleetUpdate = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setUpdateRequest(undefined);
    setUpdateError(undefined);
    setisSubmitSuccess(false);
  }, [isSubmitting]);

  const confirmFleetUpdate = useCallback(async () => {
    if (!updateRequest) return;

    const fleetName = updateRequest.fleet.metadata.name;
    const currentVersion =
      updateRequest.fleet.spec.template.spec.os?.catalogItemRef?.version;
    if (!fleetName || !currentVersion) {
      setUpdateError(
        'The fleet operating system catalog reference is unavailable.',
      );
      return;
    }

    setIsSubmitting(true);
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
      setisSubmitSuccess(true);
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : 'Unable to update fleet.',
      );
    } finally {
      setIsSubmitting(false);
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
    isSubmitting,
    updateError,
    isSubmitSuccess,
    openFleetUpdate,
    closeFleetUpdate,
    confirmFleetUpdate,
    handleFleetUpdateDialogOpen,
  };
};

export default useFleetUpdate;
