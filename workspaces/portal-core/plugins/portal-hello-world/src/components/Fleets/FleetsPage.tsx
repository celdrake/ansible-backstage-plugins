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
import type { CatalogItem } from '@ansible/portal-hello-world-common/alpha';
import useFleetList from '../../hooks/useFleetList';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import { FleetHealth, FleetOs, FleetDevicesCount } from './FleetRowColumns';

import '@backstage/ui/css/styles.css';

// CELIA-WIP: translations??
// CELIA-WIP: pagination
// CELIA-WIP: which fleets are fetched? which order?

const catalogItemKey = (catalog: string, item: string) =>
  `${catalog}\u0000${item}`;

// CELIA-WIP: Is banner dismissable forever?
// What are the rules to dismiss it?

// CELIA-WIP: This should be a constant in the config.
const rhemUrl = 'https://edge-manager.redhat.com';

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

const FleetsPage = () => {
  const { fleets, totalOfflineDevices } = useFleetList();
  const fleetNames = fleets.map(fleet => fleet.metadata.name as string);
  const catalogItemsState = useFleetCatalogItems(fleetNames);

  const [showLink, setShowLink] = React.useState(true);
  const catalogItems =
    catalogItemsState.status === 'loaded' ? catalogItemsState.catalogItems : [];
  const catalogItemsByRef = React.useMemo(() => {
    const byRef = new Map<string, CatalogItem>();
    catalogItems.forEach(catalogItem => {
      const name = catalogItem.metadata.name;
      if (name) {
        byRef.set(
          catalogItemKey(catalogItem.metadata.catalog, name),
          catalogItem,
        );
      }
    });
    return byRef;
  }, [catalogItems]);

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
        title: 'Catalog',
        render: fleet => {
          const ref = fleet.spec.template.spec.os?.catalogItemRef;
          const catalogItem = ref
            ? catalogItemsByRef.get(catalogItemKey(ref.catalog, ref.item))
            : undefined;
          return (
            <FleetOs
              fleet={fleet}
              catalogItem={catalogItem}
              catalogItemsLoading={catalogItemsState.status === 'loading'}
            />
          );
        },
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
    [catalogItemsByRef, catalogItemsState.status],
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
          showLink ? (
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
              customActions={[<CloseIcon onClick={() => setShowLink(false)} />]}
              icon
              mt="4"
            />
          ) : null
        }
      />
      <Content>
        <Box>
          {catalogItemsState.status === 'error' && (
            <Alert
              status="danger"
              title="Unable to load OS catalog items"
              description={catalogItemsState.message}
              icon
              mb="4"
            />
          )}
          <FleetsPageSummary
            fleetCount={fleets.length}
            offlineDevicesCount={totalOfflineDevices}
          />
          <Table<Fleet>
            title=""
            options={{ paging: false, search: true }}
            columns={columns}
            data={fleets}
          />
        </Box>
      </Content>
    </Page>
  );
};

export default FleetsPage;
