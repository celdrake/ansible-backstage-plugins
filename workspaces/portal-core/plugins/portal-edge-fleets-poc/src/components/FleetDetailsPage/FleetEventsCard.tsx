import React from 'react';
import {
  ButtonIcon,
  Card,
  CardBody,
  Flex,
  Select,
  Text,
  Tooltip,
  TooltipTrigger,
} from '@backstage/ui';
import {
  RiErrorWarningLine,
  RiInformationLine,
  RiRefreshLine,
} from '@remixicon/react';

import { Event } from '@ansible/portal-edge-fleets-poc-common';
import useFleetEvents, {
  EventTypeFilter,
  DisplayEvent,
} from '../../hooks/useFleetEvents';
import FleetDetailsCardHeader from './FleetDetailsCardHeader';
import { timeSinceEpochText } from '../../utils/time';

import styles from './FleetEventsCard.module.css';

type EventTypeFilterOption = {
  id: EventTypeFilter | 'all';
  label: string;
};

const EVENT_TYPE_FILTER_OPTIONS: Array<EventTypeFilterOption> = [
  { id: 'all', label: 'All types' },
  { id: 'ResourceUpdated', label: 'Fleet updated' },
  { id: 'ResourceUpdateFailed', label: 'Fleet update failed' },
  { id: 'FleetValid', label: 'Fleet valid' },
  { id: 'FleetInvalid', label: 'Fleet invalid' },
  { id: 'FleetRolloutCreated', label: 'Fleet rollout created' },
  { id: 'FleetRolloutStarted', label: 'Fleet rollout started' },
  { id: 'FleetRolloutCompleted', label: 'Fleet rollout completed' },
  { id: 'FleetRolloutFailed', label: 'Fleet rollout failed' },
];

const FleetEventRow = ({ event }: { event: DisplayEvent }) => {
  return (
    <Flex gap="2" align="start">
      {event.type === Event.type.WARNING ? (
        <RiErrorWarningLine
          className={styles.fleetEventIcoWarning}
          aria-hidden
          size={18}
        />
      ) : (
        <RiInformationLine
          className={styles.fleetEventIconNormal}
          aria-hidden
          size={18}
        />
      )}

      <Flex direction="column" gap="1" className={styles.fleetEventItemBody}>
        <Text weight="bold">{event.reasonText}</Text>
        <Text variant="body-small">{event.message}</Text>
        <Text variant="body-small" color="secondary">
          {event.dateText}
        </Text>
      </Flex>
    </Flex>
  );
};

const FleetEventsCard = ({ fleetName }: { fleetName: string }) => {
  const [eventTypeFilter, setEventTypeFilter] =
    React.useState<EventTypeFilterOption['id']>('all');
  const { events, lastRefreshAt, refetch } = useFleetEvents({
    fleetName,
    eventType: eventTypeFilter === 'all' ? undefined : eventTypeFilter,
  });
  return (
    <Card>
      <FleetDetailsCardHeader
        title="Events"
        meta={
          <TooltipTrigger>
            <ButtonIcon
              variant="secondary"
              size="small"
              aria-label="Reload events"
              icon={<RiRefreshLine aria-hidden size={18} />}
              onClick={() => refetch()}
            />
            <Tooltip>Reload events</Tooltip>
          </TooltipTrigger>
        }
      />
      <CardBody className={styles.fleetEventsCardBody}>
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
            Updated {timeSinceEpochText(lastRefreshAt)}
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
                <li key={event.id} className={styles.fleetEventItem}>
                  <FleetEventRow event={event} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default FleetEventsCard;
