import { useCallback, useMemo } from 'react';
import { Event, type EventList } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

export type EventTypeFilter =
  | 'ResourceUpdated'
  | 'FleetValid'
  | 'FleetInvalid'
  | 'FleetRolloutCreated'
  | 'FleetRolloutStarted'
  | 'FleetRolloutCompleted';

/** Fleet events surfaced in Portal — delta events are intentionally omitted. */
export const DEFAULT_FLEET_EVENT_TYPES: readonly EventTypeFilter[] = [
  Event.reason.RESOURCE_UPDATED,
  Event.reason.FLEET_VALID,
  Event.reason.FLEET_INVALID,
  Event.reason.FLEET_ROLLOUT_CREATED,
  Event.reason.FLEET_ROLLOUT_STARTED,
  Event.reason.FLEET_ROLLOUT_COMPLETED,
];

export type UseFleetEventsOptions = {
  fleetName: string;
  eventType: EventTypeFilter | undefined;
  enabled?: boolean;
  limit?: number;
  intervalMs?: number;
};

export type FleetEventsState = {
  events: Event[];
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | undefined;
  refetch: VoidFunction;
};

const buildFleetEventsFieldSelector = (
  fleetName: string,
  eventType: EventTypeFilter | undefined,
): string => {
  const filterableReasons = eventType ? [eventType] : DEFAULT_FLEET_EVENT_TYPES;
  return [
    'involvedObject.kind=Fleet',
    `involvedObject.name=${fleetName}`,
    `reason in (${filterableReasons.join(',')})`,
  ].join(',');
};

const DEFAULT_INTERVAL_MS = 60_000;

/**
 * Loads the events of a fleet, restricted to the desired event types.
 * Refreshes periodically like the rest of the fleet detail data.
 */
const useFleetEvents = ({
  fleetName,
  eventType,
  limit,
}: UseFleetEventsOptions): FleetEventsState => {
  const flightctlFetch = useFlightCtlApiFetch();
  const hasFleetName = fleetName.length > 0;

  const fetchEvents = useCallback(
    async (signal: AbortSignal) => {
      const query = new URLSearchParams();
      query.set(
        'fieldSelector',
        buildFleetEventsFieldSelector(fleetName, eventType),
      );

      query.set('limit', String(limit || '500'));

      const eventList = await flightctlFetch<EventList>(
        `/events?${query.toString()}`,
        signal,
      );
      return eventList.items;
    },
    [flightctlFetch, fleetName, limit, eventType],
  );

  const periodicState = useFetchPeriodically(fetchEvents, {
    enabled: hasFleetName,
    intervalMs: DEFAULT_INTERVAL_MS,
  });

  const { data, isLoading, isUpdating, error, refetch } = periodicState;

  return useMemo(
    () => ({
      events: data ?? [],
      isLoading,
      isUpdating,
      error,
      refetch,
    }),
    [data, error, isLoading, isUpdating, refetch],
  );
};

export default useFleetEvents;
