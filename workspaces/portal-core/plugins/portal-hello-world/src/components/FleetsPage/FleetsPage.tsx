import * as React from 'react';
import {
  Content,
  Header,
  Page,
  Table,
  type TableColumn,
} from '@backstage/core-components';
import { Alert, Badge, Box, Flex, Link, Text } from '@backstage/ui';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';

import { type Fleet } from '@ansible/portal-hello-world-common';
import useFleetList, {
  type SuccessFleetListState,
} from '../../hooks/useFleetList';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import { FleetHealth, FleetOs, FleetDevicesCount } from './FleetRowColumns';

import '@backstage/ui/css/styles.css';

// CELIA-WIP: translations??
// CELIA-WIP: pagination
// CELIA-WIP: which fleets are fetched? which order?

// CELIA-WIP: Is banner dismissable forever?
// What are the rules to dismiss it?

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
}: {
  fleetListState: SuccessFleetListState;
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
        render: fleet => <FleetHealth fleet={fleet} />,
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
        render: _fleet => 'Sat 02:00 - 06:00 UTC',
      },
      {
        title: 'Actions',
        render: _fleet => 'WIP',
      },
    ],
    [catalogItemsState],
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
    content = <FleetsPageContent fleetListState={fleetListState} />;
  }

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
    </Page>
  );
};

export default FleetsPage;
