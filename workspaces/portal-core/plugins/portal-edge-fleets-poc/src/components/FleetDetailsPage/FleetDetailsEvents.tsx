import React from 'react';
import { Select, Text } from '@backstage/ui';

const fakeStyles = {
  eventToolbar: 'event-toolbar',
  eventTypeSelect: 'event-type-select',
  eventsUpdatedLabel: 'events-updated-label',
  eventList: 'event-list',
  eventScroll: 'event-scroll',
};

type EventTypeFilter = 'all';

const FleetDetailsEvents = () => {
  const events = [];

  const [eventTypeFilter, setEventTypeFilter] =
    React.useState<EventTypeFilter>('all');

  const [eventPageSize, setEventPageSize] = React.useState(10);
  const [eventPageIndex, setEventPageIndex] = React.useState(0);

  const totalMatching = events.length;

  return (
    <>
      <div className={fakeStyles.eventToolbar}>
        <Select
          className={fakeStyles.eventTypeSelect}
          aria-label="Filter events by type"
          selectedKey={eventTypeFilter}
          onSelectionChange={key => {
            setEventTypeFilter(String(key) as EventTypeFilter);
            setEventPageIndex(0);
          }}
          options={[{ id: 'all', label: 'All types' }]}
        />
        <Text variant="body-small" color="secondary">
          Updated just now
        </Text>
      </div>
      {totalMatching === 0 ? (
        <Text color="secondary">
          {eventTypeFilter === 'all'
            ? 'No events were found'
            : 'No events were found based on the current filters'}
        </Text>
      ) : (
        <>
          <div
            className={fakeStyles.eventScroll}
            tabIndex={0}
            role="region"
            aria-label="Fleet events"
          >
            events here
          </div>
          EVents table here
        </>
      )}
    </>
  );
};

export default FleetDetailsEvents;
