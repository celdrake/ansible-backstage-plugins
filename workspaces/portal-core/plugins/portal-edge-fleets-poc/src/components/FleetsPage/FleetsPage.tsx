import * as React from 'react';
import { Content, Header, Page } from '@backstage/core-components';
import {
  Alert,
  Badge,
  Box,
  Cell,
  CellText,
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
import useFleetsCount from '../../hooks/useFleetsCount';
import { getFleetDetailsPath, getRhemHomeUrl } from '../../utils/routes';
import { FleetOs, FleetActions } from './FleetRowColumns';
import FleetStatus from './FleetStatus';
import FleetsUpdatedDevicesBar from './FleetsUpdatedDevicesBar';
import FleetOsUpdateDialog from './FleetOsUpdateDialog';

import styles from './FleetsPage.module.css';
// CELIA-WIP: translations??
// CELIA-WIP: which fleets are fetched? which order?

// CELIA-WIP: Is banner dismissable forever? What are the rules to dismiss it?

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
  onlineDevicesCount,
  totalDevicesCount,
}: {
  onlineDevicesCount: number | undefined;
  totalDevicesCount: number | undefined;
}) => {
  const { data: fleetsCount } = useFleetsCount();

  const onlineDeviceText = onlineDevicesCount
    ? `${onlineDevicesCount}/${totalDevicesCount}`
    : '-';
  return (
    <Flex>
      <CountBox count={fleetsCount} label="Fleets" />
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
  onUpdateFleet: (
    fleet: Fleet,
    targetVersion: CatalogItemVersion,
    targetOsLabel: string,
  ) => void;
}) => {
  const {
    tableProps,
    search,
    searchError,
    fleets,
    isLoading,
    isDebouncing,
    error,
  } = fleetListState;
  const fleetNames = fleets?.map(fleet => fleet.metadata.name as string);
  const { data: devicesSummary } = useDevicesSummary();
  const catalogItemsState = useFleetCatalogItems(fleetNames ?? []);

  // CELIA-WIP: talk to Paola about how to render the different loading states.
  const columns = React.useMemo<ColumnConfig<EdgeFleet>[]>(
    () => [
      {
        id: 'fleetName',
        label: 'Fleet',
        isRowHeader: true,
        cell: fleet => {
          const fleetName = fleet.metadata.name as string;
          return (
            <CellText title={fleetName} href={getFleetDetailsPath(fleetName)} />
          );
        },
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
        {searchError && (
          <Alert
            status="danger"
            title="Invalid search"
            description={searchError}
            icon
          />
        )}
        <Table<EdgeFleet>
          columnConfig={columns}
          emptyState={<FleetsTableEmptyState hasSearch={!!search.value} />}
          {...tableProps}
          isPending={isLoading}
          isStale={isDebouncing}
        />
      </Box>
    </Content>
  );
};

const FleetsPage = () => {
  const fleetListState = useFleetList();
  const fleetUpdateState = useFleetUpdate(fleetListState.refetch);
  const [showRhemLink, setShowRhemLink] = React.useState(true);

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
                <Link
                  href={getRhemHomeUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
      <FleetsPageContent
        fleetListState={fleetListState}
        onUpdateFleet={fleetUpdateState.openFleetUpdate}
      />
      <FleetOsUpdateDialog fleetUpdateState={fleetUpdateState} />
    </Page>
  );
};

export default FleetsPage;
