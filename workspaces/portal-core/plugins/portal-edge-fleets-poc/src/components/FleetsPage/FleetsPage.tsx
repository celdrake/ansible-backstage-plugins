import * as React from 'react';
import { Content, Header, Page } from '@backstage/core-components';
import {
  Alert,
  Badge,
  Box,
  Cell,
  ColumnConfig,
  Flex,
  Link,
  SearchField,
  Table,
  Text,
} from '@backstage/ui';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';

import type { CatalogItemVersion } from '@ansible/portal-edge-fleets-poc-common/alpha';
import {
  DeviceSummaryStatusType,
  type Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import useFleetList, {
  type EdgeFleet,
  type FleetListState,
} from '../../hooks/useFleetList';
import useDevicesSummary from '../../hooks/useDevicesSummary';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import { FleetOs, FleetActions } from './FleetRowColumns';
import FleetStatus from './FleetStatus';
import FleetsUpdatedDevicesBar from './FleetsUpdatedDevicesBar';
import FleetOsUpdateDialog from './FleetOsUpdateDialog';

import styles from './FleetsPage.module.css';
// CELIA-WIP: translations??
// CELIA-WIP: which fleets are fetched? which order?

// CELIA-WIP: Is banner dismissable forever? What are the rules to dismiss it?

// CELIA-WIP: This should be a constant in the config.
const rhemUrl = 'https://edge-manager.redhat.com';

const CountBox = ({
  count,
  label,
}: {
  count: number | string | undefined;
  label: string;
}) => {
  return (
    <div style={{ marginBottom: 20 }}>
      <div>
        <Text variant="body-large" color="primary">
          {count ?? '-'}
        </Text>
      </div>
      <div>
        <Text variant="body-small" color="secondary">
          {label}
        </Text>
      </div>
    </div>
  );
};

const FleetsPageSummary = ({
  fleetCount,
  onlineDevicesCount,
  totalDevicesCount,
}: {
  fleetCount: number | undefined;
  onlineDevicesCount: number | undefined;
  totalDevicesCount: number | undefined;
}) => {
  const onlineDeviceText = onlineDevicesCount
    ? `${onlineDevicesCount}/${totalDevicesCount}`
    : '-';
  return (
    <Flex>
      <CountBox count={fleetCount} label="Fleets on page" />
      <CountBox count={onlineDeviceText} label="Devices online" />
    </Flex>
  );
};

const FleetsTableEmptyState = ({ hasSearch }: { hasSearch: boolean }) => {
  return (
    <div className={styles.fleetListTableEmptyState}>
      <Text weight="bold">
        {hasSearch ? 'No fleets match your search' : 'No edge fleets'}
      </Text>
      <Text color="secondary">
        {hasSearch
          ? 'Try a different search.'
          : 'When fleets are available, they will appear in this list.'}
      </Text>
    </div>
  );
};

const FleetsPageContent = ({
  fleetListState,
  onUpdateFleet,
}: {
  fleetListState: FleetListState;
  onUpdateFleet: (fleet: Fleet, targetVersion: CatalogItemVersion) => void;
}) => {
  const {
    tableProps,
    search,
    fleets,
    pagination,
    isLoading,
    isUpdating,
    isDebouncing,
    error,
  } = fleetListState;
  const currentFleets = fleets ?? [];
  const fleetNames = currentFleets.map(fleet => fleet.metadata.name as string);
  const { data: devicesSummary } = useDevicesSummary();
  const catalogItemsState = useFleetCatalogItems(fleetNames);

  // CELIA-WIP: talk to Paola about how to render the different loading states.
  const columns = React.useMemo<ColumnConfig<EdgeFleet>[]>(
    () => [
      {
        id: 'fleetName',
        label: 'Fleet',
        isRowHeader: true,
        cell: fleet => <Cell>{fleet.metadata.name as string}</Cell>,
      },
      {
        id: 'fleetStatus',
        label: 'Status',
        cell: fleet => (
          <Cell>
            <FleetStatus fleetStatus={fleet.status} />
          </Cell>
        ),
      },
      {
        id: 'fleetOs',
        label: 'OS target',
        cell: fleet => (
          <Cell>
            <FleetOs fleet={fleet} catalogItemState={catalogItemsState} />
          </Cell>
        ),
      },
      {
        id: 'devices',
        label: 'Devices',
        cell: fleet => (
          <Cell>
            <FleetsUpdatedDevicesBar fleet={fleet} />
          </Cell>
        ),
      },
      {
        id: 'actions',
        label: 'Actions',
        cell: fleet => (
          <Cell>
            <FleetActions
              fleet={fleet}
              catalogItemState={catalogItemsState}
              onUpdate={onUpdateFleet}
            />
          </Cell>
        ),
      },
    ],
    [catalogItemsState, onUpdateFleet],
  );

  return (
    <Content>
      <Box>
        {error && (
          <Alert
            status="danger"
            title="Unable to load fleets"
            description={error.message}
            icon
            mb="4"
          />
        )}
        <FleetsPageSummary
          fleetCount={fleets?.length}
          onlineDevicesCount={
            devicesSummary?.summaryStatus[
              DeviceSummaryStatusType.DeviceSummaryStatusOnline
            ]
          }
          totalDevicesCount={devicesSummary?.total}
        />
        <SearchField
          aria-label="Search fleets by name"
          placeholder="Search fleets..."
          {...search}
        />
        <Table<EdgeFleet>
          columnConfig={columns}
          emptyState={
            <FleetsTableEmptyState hasSearch={!!search.value.trim()} />
          }
          {...tableProps}
          pagination={pagination}
          isPending={isLoading}
          isStale={isUpdating || isDebouncing}
        />
      </Box>
    </Content>
  );
};

const FleetsPage = () => {
  const fleetListState = useFleetList();
  const fleetUpdateState = useFleetUpdate(fleetListState.refetch);
  const [showRhemLink, setShowRhemLink] = React.useState(true);

  const content = (
    <FleetsPageContent
      fleetListState={fleetListState}
      onUpdateFleet={fleetUpdateState.openFleetUpdate}
    />
  );

  return (
    <Page themeId="app">
      <Header
        pageTitleOverride="Edge fleets"
        title={
          <Box>
            <Flex align="center" style={{ gap: 10 }}>
              <span>Edge fleets</span>
              <Badge size="small">Preview</Badge>
            </Flex>
            <Text variant="body-medium" color="primary">
              Monitor fleet health and apply catalog updates.
            </Text>
          </Box>
        }
        subtitle={
          showRhemLink && (
            <Alert
              status="info"
              title="Monitor fleet health and apply catalog updates from here. Enroll new devices and change fleet configuration in Edge Manager."
              description={
                <Link href={rhemUrl} target="_blank" rel="noopener noreferrer">
                  <Flex>
                    Open Edge Manager
                    <OpenInNewIcon style={{ fontSize: 16 }} />
                  </Flex>
                </Link>
              }
              customActions={
                <CloseIcon onClick={() => setShowRhemLink(false)} />
              }
              icon
              mt="4"
            />
          )
        }
      />
      {content}

      <FleetOsUpdateDialog fleetUpdateState={fleetUpdateState} />
    </Page>
  );
};

export default FleetsPage;
