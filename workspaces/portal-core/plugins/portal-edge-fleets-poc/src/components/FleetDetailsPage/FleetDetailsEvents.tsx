import React from 'react';
import { Flex, Select, Text } from '@backstage/ui';
import { RiInformationLine } from '@remixicon/react';

import { Event } from '@ansible/portal-edge-fleets-poc-common';
import useFleetEvents, { EventTypeFilter } from '../../hooks/useFleetEvents';
import styles from './FleetDetailsEvents.module.css';

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

// CELIA WIP FORMAT TIME
const FleetEventRow = ({ event }: { event: Event }) => {
  return (
    <Flex gap="2" align="start">
      <RiInformationLine
        className={styles.fleetEventIcon}
        aria-hidden
        size={18}
      />
      <Flex direction="column" gap="1" className={styles.fleetEventItemBody}>
        <Text weight="bold">{event.reason}</Text>
        <Text variant="body-small">{event.message}</Text>
        <Text variant="body-small" color="secondary">
          {event.metadata.creationTimestamp}
        </Text>
      </Flex>
    </Flex>
  );
};

const FleetDetailsEvents = ({ fleetName }: { fleetName: string }) => {
  const [eventTypeFilter, setEventTypeFilter] =
    React.useState<EventTypeFilterOption['id']>('all');
  const { events } = useFleetEvents({
    fleetName,
    eventType: eventTypeFilter === 'all' ? undefined : eventTypeFilter,
  });

  return (
    <>
      <div className={styles.fleetEventToolbar}>
        <Select
          className={styles.fleetEventTypeSelect}
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
          className={styles.fleetEventsScroll}
          tabIndex={0}
          role="region"
          aria-label="Fleet events"
        >
          <ul className={styles.fleetEventsList}>
            {events.map(event => (
              <li key={event.metadata.name} className={styles.fleetEventItem}>
                <FleetEventRow event={event} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default FleetDetailsEvents;
