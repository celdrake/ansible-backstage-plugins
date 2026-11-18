import * as React from 'react';
import { Event, type EventList } from '@ansible/portal-edge-fleets-poc-common';
import useFetchPeriodically from './useFetchPeriodically';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';
import { getDateDisplay } from '../utils/time';

export type EventTypeFilter =
  | 'ResourceUpdated'
  | 'ResourceUpdateFailed'
  | 'FleetValid'
  | 'FleetInvalid'
  | 'FleetRolloutCreated'
  | 'FleetRolloutStarted'
  | 'FleetRolloutCompleted'
  | 'FleetRolloutFailed';

export const DEFAULT_FLEET_EVENT_TYPES: readonly EventTypeFilter[] = [
  Event.reason.RESOURCE_UPDATED,
  Event.reason.RESOURCE_UPDATE_FAILED,
  Event.reason.FLEET_VALID,
  Event.reason.FLEET_INVALID,
  Event.reason.FLEET_ROLLOUT_CREATED,
  Event.reason.FLEET_ROLLOUT_STARTED,
  Event.reason.FLEET_ROLLOUT_COMPLETED,
  Event.reason.FLEET_ROLLOUT_FAILED,
];

export type UseFleetEventsOptions = {
  fleetName: string;
  eventType: EventTypeFilter | undefined;
  enabled?: boolean;
  limit?: number;
  intervalMs?: number;
};

export type DisplayEvent = Pick<Event, 'type' | 'message'> & {
  id: string;
  dateText: string;
  reasonText: string;
};

export type FleetEventsState = {
  events: DisplayEvent[];
  lastRefreshAt: number;
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

const DEFAULT_INTERVAL_MS = 3 * 60_000; // 3 minutes
const MAX_LIMIT = 500;

// Omit the event message for other event reasons, as they are almost identical to the reason itself.
const EVENT_TYPES_WITH_MESSAGE = [
  Event.reason.RESOURCE_UPDATED,
  Event.reason.RESOURCE_UPDATE_FAILED,
];

const getEventReasonTitles = (): Record<EventTypeFilter, string> => {
  return {
    [Event.reason.RESOURCE_UPDATED]: 'Fleet updated successfully',
    [Event.reason.RESOURCE_UPDATE_FAILED]: 'Fleet could not be updated',
    [Event.reason.FLEET_VALID]: 'Fleet specification is valid',
    [Event.reason.FLEET_INVALID]: 'Fleet specification is invalid',
    [Event.reason.FLEET_ROLLOUT_STARTED]: 'Fleet rollout started',
    [Event.reason.FLEET_ROLLOUT_CREATED]: 'Fleet rollout created',
    [Event.reason.FLEET_ROLLOUT_FAILED]: 'Fleet rollout failed',
    [Event.reason.FLEET_ROLLOUT_COMPLETED]: 'Fleet rollout completed',
  };
};

const eventMapper = (event: Event): DisplayEvent => {
  const eventReasonTitles = getEventReasonTitles();
  return {
    id: event.metadata.name as string,
    type: event.type,
    message: EVENT_TYPES_WITH_MESSAGE.includes(event.reason)
      ? event.message
      : '',
    dateText: getDateDisplay(event.metadata.creationTimestamp),
    reasonText:
      eventReasonTitles[event.reason as EventTypeFilter] || event.reason,
  };
};

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
  const [lastRefreshAt, setLastRefreshAt] = React.useState<number>(0);

  const hasFleetName = fleetName.length > 0;

  const fetchEvents = React.useCallback(
    async (signal: AbortSignal) => {
      const query = new URLSearchParams({
        limit: String(limit || MAX_LIMIT),
      });
      query.set(
        'fieldSelector',
        buildFleetEventsFieldSelector(fleetName, eventType),
      );

      const eventList = await flightctlFetch<EventList>(
        `/events?${query.toString()}`,
        signal,
      );
      setLastRefreshAt(Date.now());
      return eventList.items;
    },
    [flightctlFetch, fleetName, limit, eventType],
  );

  const periodicState = useFetchPeriodically(fetchEvents, {
    enabled: hasFleetName,
    intervalMs: DEFAULT_INTERVAL_MS,
  });

  const { data, isLoading, isUpdating, error, refetch } = periodicState;

  return React.useMemo(
    () => ({
      events: (data ?? []).map(eventMapper),
      lastRefreshAt,
      isLoading,
      isUpdating,
      error,
      refetch,
    }),
    [data, error, isLoading, isUpdating, refetch, lastRefreshAt],
  );
};

export default useFleetEvents;
