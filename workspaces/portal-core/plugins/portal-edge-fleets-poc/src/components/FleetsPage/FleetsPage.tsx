import * as React from 'react';
import {
  Alert,
  Card,
  CardBody,
  Cell,
  CellText,
  ColumnConfig,
  Flex,
  Link,
  SearchField,
  Table,
  Text,
} from '@backstage/ui';
import { Progress } from '@backstage/core-components';

import type {
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-edge-fleets-poc-common/alpha';
import { type Fleet } from '@ansible/portal-edge-fleets-poc-common';
import useFleetList, {
  type EdgeFleet,
  type FleetListState,
} from '../../hooks/useFleetList';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import useFleetsCount from '../../hooks/useFleetsCount';
import {
  AccessDenied,
  useUserPermissions,
} from '../../hooks/useUserPermissions';
import {
  listFleetsPermission,
  viewFleetDetailsPermission,
} from '../../constants/permissions';
import { getFleetDetailsPath } from '../../utils/routes';
import AppLayout from '../Layout/AppLayout';
import AppHeader from '../Layout/AppHeader';
import { FleetOs, FleetActions } from './FleetRowColumns';
import FleetStatus from './FleetStatus';
import FleetDevicesBar from './FleetDevicesBar';
import FleetOsUpdateDialog from './FleetOsUpdateDialog';

import styles from './FleetsPage.module.css';

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
  canViewFleetDetails,
}: {
  fleetListState: FleetListState;
  onUpdateFleet: (
    fleet: Fleet,
    osCatalogItem: CatalogItem,
    targetVersion: CatalogItemVersion,
  ) => void;
  canViewFleetDetails: boolean;
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
  const catalogItemsState = useFleetCatalogItems(fleetNames ?? []);

  const columns = React.useMemo<ColumnConfig<EdgeFleet>[]>(
    () => [
      {
        id: 'fleetName',
        label: 'Fleet',
        isRowHeader: true,
        cell: fleet => {
          const fleetName = fleet.metadata.name as string;
          if (!canViewFleetDetails) {
            return <CellText title={fleetName} />;
          }
          return (
            <Cell>
              <Link
                href={getFleetDetailsPath(fleetName)}
                variant="body-medium"
                color="info"
                truncate
                title={fleetName}
                className={styles.fleetNameLink}
              >
                {fleetName}
              </Link>
            </Cell>
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
            <FleetDevicesBar
              fleet={fleet}
              header={
                <Text variant="body-small" weight="bold">
                  {fleet.status?.devicesSummary?.total || '0'} devices
                </Text>
              }
            />
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
    <Flex direction="column" gap="6">
      {error && (
        <Alert
          status="danger"
          title="Unable to load fleets"
          description={error.message}
          icon
          mb="4"
        />
      )}

      <Flex gap="4" align="end" className={styles.fleetsListSearchToolbar}>
        <SearchField
          aria-label="Search fleets by name"
          placeholder="Search fleets..."
          {...search}
        />
      </Flex>
      {searchError && (
        <Alert
          status="danger"
          title="Invalid search"
          description={searchError}
          icon
        />
      )}
      <Card style={{ paddingBlock: 0 }}>
        <CardBody>
          <Table<EdgeFleet>
            columnConfig={columns}
            emptyState={<FleetsTableEmptyState hasSearch={!!search.value} />}
            {...tableProps}
            isPending={isLoading}
            isStale={isDebouncing}
          />
        </CardBody>
      </Card>
    </Flex>
  );
};

const FleetsPageBody = ({
  canViewFleetDetails,
}: {
  canViewFleetDetails: boolean;
}) => {
  const fleetListState = useFleetList();
  const fleetUpdateState = useFleetUpdate(fleetListState.refetch);

  const { data: fleetCount, isLoading: isLoadingCount } = useFleetsCount();
  return (
    <AppLayout
      title="Edge"
      header={
        <AppHeader
          title="Edge fleets"
          description="Review fleet OS target state and apply catalog OS updates. Full device and image management stays in Red Hat Edge Manager."
          tags={[
            {
              label: isLoadingCount
                ? 'Loading...'
                : `${fleetCount} ${fleetCount === 1 ? 'fleet' : 'fleets'}`,
            },
          ]}
        />
      }
    >
      <FleetsPageContent
        fleetListState={fleetListState}
        onUpdateFleet={fleetUpdateState.openFleetUpdate}
        canViewFleetDetails={canViewFleetDetails}
      />
      <FleetOsUpdateDialog fleetUpdateState={fleetUpdateState} />
    </AppLayout>
  );
};

const FleetsPage = () => {
  const { loading: loadingPermissions, checkPermissions } =
    useUserPermissions();

  if (loadingPermissions) {
    return <Progress />;
  }
  const [canListFleets, canViewFleetDetails] = checkPermissions([
    listFleetsPermission,
    viewFleetDetailsPermission,
  ]);
  if (!canListFleets) {
    return <AccessDenied />;
  }
  return <FleetsPageBody canViewFleetDetails={canViewFleetDetails} />;
};

export default FleetsPage;
