import * as React from 'react';
import {
  Content,
  Header,
  Page,
  Table,
  type TableColumn,
} from '@backstage/core-components';
import {
  Alert,
  Badge,
  Box,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Flex,
  Link,
  Text,
} from '@backstage/ui';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';

import type { CatalogItemVersion } from '@ansible/portal-edge-fleets-poc-common/alpha';
import { type Fleet } from '@ansible/portal-edge-fleets-poc-common';
import useFleetList, {
  type SuccessFleetListState,
} from '../../hooks/useFleetList';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import {
  FleetOs,
  FleetDevicesCount,
  FleetMaintenanceWindow,
  FleetActions,
} from './FleetRowColumns';
import FleetStatus from './FleetStatus';

import '@backstage/ui/css/styles.css';

// CELIA-WIP: translations??
// CELIA-WIP: pagination
// CELIA-WIP: which fleets are fetched? which order?

// CELIA-WIP: Is banner dismissable forever? What are the rules to dismiss it?

// CELIA-WIP: This should be a constant in the config.
const rhemUrl = 'https://edge-manager.redhat.com';

// Avoid error in the console by providing a custom renderer for actions.
const NoMaterialTableActions = () => null;

const NumberBox = ({ number, label }: { number: number; label: string }) => {
  return (
    <div style={{ marginBottom: 20 }}>
      <div>
        <Text variant="body-large" color="primary">
          {number}
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
  offlineDevicesCount,
}: {
  fleetCount: number;
  offlineDevicesCount: number;
}) => {
  return (
    <Flex>
      <NumberBox number={fleetCount} label="Fleets" />
      <NumberBox number={offlineDevicesCount} label="Devices offline" />
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
  const { fleets, totalOfflineDevices } = fleetListState;
  const fleetNames = fleets.map(fleet => fleet.metadata.name as string);
  const catalogItemsState = useFleetCatalogItems(fleetNames);

  // CELIA-WIP: talk to Paola about how to render the different loading states.
  const columns = React.useMemo<TableColumn<Fleet>[]>(
    () => [
      {
        title: 'Fleet',
        field: 'metadata.name',
        highlight: true,
        render: fleet => <strong>{fleet.metadata.name as string}</strong>,
      },
      {
        title: 'Health',
        render: fleet => <FleetStatus fleetStatus={fleet.status} />,
      },
      {
        title: 'Devices',
        render: fleet => <FleetDevicesCount fleet={fleet} />,
      },
      {
        title: 'Operating System',
        render: fleet => (
          <FleetOs fleet={fleet} catalogItemState={catalogItemsState} />
        ),
      },
      {
        title: 'Maintenance window',
        render: fleet => <FleetMaintenanceWindow fleet={fleet} />,
      },
      {
        title: 'Actions',
        render: fleet => (
          <FleetActions
            fleet={fleet}
            catalogItemState={catalogItemsState}
            onUpdate={onUpdateFleet}
          />
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
          offlineDevicesCount={totalOfflineDevices}
        />
        <Table<Fleet>
          title=""
          components={{ Actions: NoMaterialTableActions }}
          options={{ paging: false, search: true }}
          columns={columns}
          data={fleets}
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
    handleFleetUpdateDialogOpenChange,
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
        onOpenChange={handleFleetUpdateDialogOpenChange}
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
