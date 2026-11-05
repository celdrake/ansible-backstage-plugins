import * as React from 'react';
import { Content, Header, Page } from '@backstage/core-components';
import {
  Alert,
  Badge,
  Box,
  Button,
  Cell,
  ColumnConfig,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Flex,
  Link,
  Table,
  Text,
  useTable,
} from '@backstage/ui';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';

import type { CatalogItemVersion } from '@ansible/portal-edge-fleets-poc-common/alpha';
import {
  DeviceSummaryStatusType,
  type Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import useFleetList, {
  type SuccessFleetListState,
} from '../../hooks/useFleetList';
import useDevicesSummary from '../../hooks/useDevicesSummary';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import { FleetOs, FleetActions } from './FleetRowColumns';
import FleetStatus from './FleetStatus';
import FleetsUpdatedDevicesBar from './FleetsUpdatedDevicesBar';
import styles from './FleetsPage.module.css';
// CELIA-WIP: translations??
// CELIA-WIP: pagination
// CELIA-WIP: which fleets are fetched? which order?

// CELIA-WIP: Is banner dismissable forever? What are the rules to dismiss it?

// CELIA-WIP: This should be a constant in the config.
const rhemUrl = 'https://edge-manager.redhat.com';

type FleetTableRow = Fleet & { id: string };

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
  fleetCount: number;
  onlineDevicesCount: number | undefined;
  totalDevicesCount: number | undefined;
}) => {
  const onlineDeviceText = onlineDevicesCount
    ? `${onlineDevicesCount}/${totalDevicesCount}`
    : '-';
  return (
    <Flex>
      <CountBox count={fleetCount} label="Fleets" />
      <CountBox count={onlineDeviceText} label="Devices online" />
    </Flex>
  );
};

const FleetsPageContent = ({
  fleetListState,
  onUpdateFleet,
}: {
  fleetListState: SuccessFleetListState;
  onUpdateFleet: (fleet: Fleet, targetVersion: CatalogItemVersion) => void;
}) => {
  const { fleets } = fleetListState;
  const { data: devicesSummary } = useDevicesSummary();
  const fleetNames = fleets.map(fleet => fleet.metadata.name as string);
  const catalogItemsState = useFleetCatalogItems(fleetNames);

  const tableData = React.useMemo<FleetTableRow[]>(
    () =>
      fleets.map(fleet => ({
        ...fleet,
        id: fleet.metadata.name as string,
      })),
    [fleets],
  );
  const { tableProps } = useTable<FleetTableRow>({
    mode: 'complete',
    data: tableData,
    paginationOptions: { type: 'none' },
  });

  const search = { value: '' };
  const statusFilter = 'all';
  const osFilter = 'all';

  const emptyTitle =
    search.value || statusFilter !== 'all' || osFilter !== 'all'
      ? 'No fleets match your filters'
      : 'No edge fleets';
  const emptyBody =
    search.value || statusFilter !== 'all' || osFilter !== 'all'
      ? 'Try a different search or clear the status and OS filters.'
      : 'When fleets are available, they will appear in this list.';

  // CELIA-WIP: talk to Paola about how to render the different loading states.
  const columns = React.useMemo<ColumnConfig<FleetTableRow>[]>(
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
        <FleetsPageSummary
          fleetCount={fleets.length}
          onlineDevicesCount={
            devicesSummary?.summaryStatus[
              DeviceSummaryStatusType.DeviceSummaryStatusOnline
            ]
          }
          totalDevicesCount={devicesSummary?.total}
        />
        <Table<FleetTableRow>
          columnConfig={columns}
          {...tableProps}
          emptyState={
            <div className={styles.fleetListTableEmptyState}>
              <Text weight="bold">{emptyTitle}</Text>
              <Text color="secondary">{emptyBody}</Text>
            </div>
          }
        />
      </Box>
    </Content>
  );
};

const FleetsPage = () => {
  const fleetListState = useFleetList();
  const {
    updateRequest,
    isUpdatingFleet,
    updateError,
    updateSubmitted,
    openFleetUpdate,
    closeFleetUpdate,
    confirmFleetUpdate,
    handleFleetUpdateDialogOpen,
  } = useFleetUpdate(fleetListState.refetch);
  const [showRhemLink, setShowRhemLink] = React.useState(true);

  let content;
  if (fleetListState.status === 'loading') {
    content = (
      <Text variant="body-medium" color="secondary">
        Loading fleets…
      </Text>
    );
  } else if (fleetListState.status === 'error') {
    content = (
      <Alert
        status="danger"
        title="Unable to load fleets"
        description={fleetListState.message}
        icon
        mb="4"
      />
    );
  } else {
    content = (
      <FleetsPageContent
        fleetListState={fleetListState}
        onUpdateFleet={openFleetUpdate}
      />
    );
  }

  const fleetName = updateRequest?.fleetName ?? '';
  const currentVersion = updateRequest?.currentVersion ?? 'unknown';

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
      <Dialog
        isOpen={Boolean(updateRequest)}
        isDismissable={!isUpdatingFleet}
        isKeyboardDismissDisabled={isUpdatingFleet}
        onOpenChange={handleFleetUpdateDialogOpen}
      >
        <DialogHeader>Confirm fleet update</DialogHeader>
        <DialogBody>
          <Text variant="body-medium">
            Update the operating system for fleet <strong>{fleetName}</strong>?
          </Text>
          <Box mt="3">
            <Text variant="body-small" color="secondary">
              Upgrade path
            </Text>
            <Flex align="center" gap="2">
              <Text variant="body-medium">{currentVersion}</Text>
              <span aria-hidden="true">→</span>
              <Text variant="body-medium">
                {updateRequest?.targetVersion.version}
              </Text>
            </Flex>
          </Box>
          {updateError && (
            <Alert
              status="danger"
              title="Unable to update fleet"
              description={updateError}
              icon
              mt="3"
            />
          )}
          {updateSubmitted && (
            <Alert
              status="success"
              title="Fleet update requested"
              description={`Fleet ${fleetName} is configured to update to version ${updateRequest?.targetVersion.version}.`}
              icon
              mt="3"
            />
          )}
        </DialogBody>
        <DialogFooter>
          {updateSubmitted ? (
            <Button variant="primary" onClick={closeFleetUpdate}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={closeFleetUpdate}
                isDisabled={isUpdatingFleet}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmFleetUpdate}
                isPending={isUpdatingFleet}
              >
                Confirm update
              </Button>
            </>
          )}
        </DialogFooter>
      </Dialog>
    </Page>
  );
};

export default FleetsPage;
