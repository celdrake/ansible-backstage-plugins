import React from 'react';
import { Select, Text } from '@backstage/ui';
import useFleetEvents, { EventTypeFilter } from '../../hooks/useFleetEvents';

const fakeStyles = {
  eventToolbar: 'event-toolbar',
  eventTypeSelect: 'event-type-select',
  eventsUpdatedLabel: 'events-updated-label',
  eventList: 'event-list',
  eventScroll: 'event-scroll',
};

type EventTypeFilterOption = {
  id: EventTypeFilter | 'all';
  label: string;
};

const EVENT_TYPE_FILTER_OPTIONS: Array<EventTypeFilterOption> = [
  { id: 'all', label: 'All types' },
  { id: 'ResourceUpdated', label: 'Fleet updated' },
  { id: 'FleetValid', label: 'Fleet valid' },
  { id: 'FleetInvalid', label: 'Fleet invalid' },
  { id: 'FleetRolloutCreated', label: 'Fleet rollout created' },
  { id: 'FleetRolloutStarted', label: 'Fleet rollout started' },
  { id: 'FleetRolloutCompleted', label: 'Fleet rollout completed' },
];

const FleetDetailsEvents = ({ fleetName }: { fleetName: string }) => {
  const [eventTypeFilter, setEventTypeFilter] =
    React.useState<EventTypeFilterOption['id']>('all');
  const { events } = useFleetEvents({
    fleetName,
    eventType: eventTypeFilter === 'all' ? undefined : eventTypeFilter,
  });

  return (
    <>
      <div className={fakeStyles.eventToolbar}>
        <Select
          className={fakeStyles.eventTypeSelect}
          aria-label="Filter events by type"
          value={eventTypeFilter}
          onChange={key => {
            setEventTypeFilter(String(key) as EventTypeFilter);
          }}
          options={EVENT_TYPE_FILTER_OPTIONS}
        />
        <Text variant="body-small" color="secondary">
          Updated just now
        </Text>
      </div>
      {events.length === 0 ? (
        <Text color="secondary">
          {eventTypeFilter === 'all'
            ? 'No events were found'
            : 'No events were found based on the current filters'}
        </Text>
      ) : (
        <div
          className={fakeStyles.eventScroll}
          tabIndex={0}
          role="region"
          aria-label="Fleet events"
        >
          <ul className={fakeStyles.eventList}>
            {events.map(event => (
              <li
                key={
                  event.metadata.name ??
                  `${event.reason}-${event.metadata.creationTimestamp}`
                }
              >
                {event.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default FleetDetailsEvents;
