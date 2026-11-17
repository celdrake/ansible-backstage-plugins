import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  Flex,
  Text,
} from '@backstage/ui';
import { useParams } from 'react-router-dom';
import { Progress } from '@backstage/core-components';
import {
  RiExternalLinkLine,
  RiHardDrive3Line,
  RiSettings3Line,
} from '@remixicon/react';

import {
  DeviceOsSpec,
  DeviceUpdatePolicySpec,
  Fleet,
} from '@ansible/portal-edge-fleets-poc-common';
import {
  CatalogItem,
  CatalogItemVersion,
} from '@ansible/portal-edge-fleets-poc-common/alpha';
import useFleetDetails from '../../hooks/useFleetDetails';
import { getFleetsPath, getRhemHomeUrl } from '../../utils/routes';
import {
  getOsCatalogItem,
  getOsCatalogItemDisplayText,
  getOsDisplayText,
} from '../../utils/catalogItems';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate, {
  type UseFleetUpdateState,
} from '../../hooks/useFleetUpdate';
import {
  AccessDenied,
  useUserPermissions,
} from '../../hooks/useUserPermissions';
import { UpdateAvailableBadge, ViewOnlyBadge } from '../common/Badges';
import { StatusBadge } from '../common/Badges';
import DefaultEmptyState from '../common/DefaultEmptyState';
import AppLayout from '../Layout/AppLayout';
import AppHeader from '../Layout/AppHeader';
import FleetStatus, {
  FleetStatusItem,
  getFleetStatusItem,
} from '../FleetsPage/FleetStatus';
import FleetOsUpdateDialog from '../FleetsPage/FleetOsUpdateDialog';
import {
  getFleetOsSourceDetail,
  getOsSourceLabel,
  OsType,
} from '../../utils/os';
import {
  updateFleetPermission,
  viewFleetDetailsPermission,
} from '../../constants/permissions';
import ViewField from '../common/ViewField';
import FleetUpdatePolicyDetails from '../common/FleetUpdatePolicyDetails';
import FleetDetailsCardHeader from './FleetDetailsCardHeader';
import FleetUpdateStatusDetail from './FleetUpdateStatusDetail';
import FleetDetailsApplications from './FleetDetailsApplications';
import FleetEventsCard from './FleetEventsCard';

import styles from './FleetDetailsPage.module.css';

const FleetMaintenanceWindow = ({
  updatePolicy,
  canUpdateFleet,
}: {
  updatePolicy: DeviceUpdatePolicySpec | undefined;
  canUpdateFleet: boolean;
}) => {
  const updateSchedule = updatePolicy?.updateSchedule;
  const downloadSchedule = updatePolicy?.downloadSchedule;
  const schedule = updateSchedule || downloadSchedule;
  let text;
  if (canUpdateFleet) {
    text =
      'Devices receive updates as soon as they are available. Set a window in Edge Manager to control download and install timing.';
  } else {
    text =
      'Devices receive updates as soon as they are available. Ask an administrator to set a window in Edge Manager if download and install timing should be controlled.';
  }
  if (!schedule) {
    return (
      <DefaultEmptyState
        icon={<RiSettings3Line size={28} />}
        title="No maintenance window"
        description="Devices receive updates as soon as they are available. Set a window in Edge Manager to control download and install timing."
        actionLabel={canUpdateFleet ? 'Set window in Edge Manager' : ''}
      />
    );
  }

  return (
    <FleetUpdatePolicyDetails
      updatePolicy={updatePolicy}
      canUpdateFleet={canUpdateFleet}
      asSeparateBlocks
    />
  );
};
// CELIA-WIP: Check overall layout and responsiveness

type FleetOsDetailsProps = {
  osSpec: DeviceOsSpec | undefined;
  catalogItem: CatalogItem | undefined;
  // Whether the OS catalogItem has an update available
  versionToUpdate: CatalogItemVersion | undefined;
  // Whether the fleet status allows updating the OS (this is a UX constraint, not one mandated by RHEM's API)
  isFleetEditable: boolean;
  // Whether the user has permission to update the fleet
  canUpdateFleet: boolean;
};

const FleetOsDetails = ({
  osSpec,
  catalogItem,
  versionToUpdate,
  isFleetEditable,
  canUpdateFleet,
}: FleetOsDetailsProps) => {
  if (!osSpec?.catalogItemRef && !osSpec?.image) {
    let text;
    if (canUpdateFleet) {
      text =
        'Ask an administrator to assign a Software Catalog OS in Edge Manager to unlock Portal OS targets and rollouts.';
    } else {
      text =
        'Assign a Software Catalog OS in Edge Manager to unlock Portal OS targets and rollouts.';
    }
    return (
      <DefaultEmptyState
        icon={<RiHardDrive3Line size={28} />}
        title="No OS defined"
        description={text}
        actionLabel={canUpdateFleet ? 'Assign OS in Edge Manager' : ''}
      />
    );
  }

  let currentVersion = null;
  let nextVersion = null;
  let osMode: OsType;
  if (osSpec?.catalogItemRef) {
    osMode = 'catalog';
    const { currentVersionText, nextVersionText } = getOsDisplayText(
      osSpec.catalogItemRef,
      catalogItem,
      versionToUpdate,
    );
    currentVersion = currentVersionText;
    nextVersion = nextVersionText;
  } else {
    osMode = 'custom';
    currentVersion = osSpec.image;
  }

  return (
    <>
      <div className={styles.fleetTargetOs}>
        <Text as="strong" variant="body-medium" weight="bold">
          {currentVersion}
        </Text>

        {isFleetEditable && versionToUpdate && <UpdateAvailableBadge />}
        {osMode === 'catalog' && !versionToUpdate && (
          <StatusBadge text="Up to date" />
        )}
      </div>
      <div className={styles.fleetOsExtraSection}>
        <ViewField label="Source">
          <Text weight="bold">{getOsSourceLabel(osMode)}</Text>
        </ViewField>
        {nextVersion && (
          <ViewField label="Available">
            <Text weight="bold">{nextVersion}</Text>
          </ViewField>
        )}
        {osSpec?.image && (
          <ViewField label="Updates">
            <Text color="secondary">
              Portal cannot change a manual OS image
            </Text>
          </ViewField>
        )}
      </div>
      <Text
        variant="body-small"
        color="secondary"
        className={styles.fleetOsSourceNote}
      >
        {getFleetOsSourceDetail(osMode)}
      </Text>
    </>
  );
};

const FleetAlert = ({ statusItem }: { statusItem: FleetStatusItem }) => {
  let title;
  let description;
  if (statusItem.id === 'Invalid') {
    title = 'Fleet invalid';
    description =
      'Fleet specification problem - OS updates are unavailable. Check with an administrator or open Edge Manager.';
  } else if (statusItem.id === 'SyncPending') {
    title = 'Sync pending';
    description =
      'Fleet is still connecting or validating. OS updates are unavailable until status is valid.';
  }

  return title ? (
    <Alert
      status="warning"
      title={title}
      description={description}
      customActions={
        <ButtonLink
          variant="secondary"
          href={getRhemHomeUrl()}
          target="_blank"
          rel="noopener noreferrer"
          iconEnd={<RiExternalLinkLine aria-hidden />}
        >
          Open Edge Manager
        </ButtonLink>
      }
    />
  ) : null;
};

const FleetDetailsPageContent = ({
  fleet,
  fleetUpdateState,
}: {
  fleet: Fleet;
  fleetUpdateState: UseFleetUpdateState;
}) => {
  const fleetName = fleet.metadata.name as string;
  const { checkPermissions } = useUserPermissions();
  const [canUpdateFleet] = checkPermissions([updateFleetPermission]);
  const osSpec = fleet.spec.template.spec.os;
  const osCatalogRef = osSpec?.catalogItemRef;

  const catalogItemsState = useFleetCatalogItems([fleetName]);

  // CELIA-WIP: DISCUSS UX WITH PAOLA, page should be renderd saying we can't tell about the OS
  if (catalogItemsState.status === 'loading') {
    return <Progress />;
  }
  if (catalogItemsState.status === 'error') {
    return (
      <Alert status="danger" title="Error loading catalog items">
        {catalogItemsState.message}
      </Alert>
    );
  }

  const fleetCatalogItems = catalogItemsState.catalogItemsList?.items || [];
  const { catalogItem, versionToUpdate } = osCatalogRef
    ? getOsCatalogItem(osCatalogRef, fleetCatalogItems)
    : { catalogItem: undefined, versionToUpdate: undefined };

  // CELIA-WIP: Design wants to block updates if the fleet is invalid
  const updatePolicy = fleet.spec.template.spec.updatePolicy;
  const hasUpdatePolicy = Boolean(
    updatePolicy?.updateSchedule || updatePolicy?.downloadSchedule,
  );

  const apps = fleet.spec.template.spec.applications || [];

  const fleetStatusItem = getFleetStatusItem(fleet.status);
  const isFleetEditable = fleetStatusItem.id === 'Valid';
  const isUpdateAvailable = isFleetEditable && versionToUpdate;
  const nextVersionText =
    catalogItem && versionToUpdate
      ? getOsCatalogItemDisplayText(catalogItem, versionToUpdate.version)
      : undefined;
  return (
    <Flex direction="column" gap="6">
      {isUpdateAvailable && canUpdateFleet && (
        <Alert
          status="info"
          title="OS update ready"
          description={
            hasUpdatePolicy
              ? `Set a new catalog OS target here. Fleet updates now. Pending OS and other fleet changes apply on devices during the next maintenance window - managed in Edge Manager.`
              : `Set a new catalog OS target here. No maintenance window is set. Fleet updates now and devices reconcile the new OS target as they connect.`
          }
          customActions={
            <Button
              variant="primary"
              onClick={() => {
                if (!catalogItem || !versionToUpdate) {
                  return;
                }
                fleetUpdateState.openFleetUpdate(
                  fleet,
                  catalogItem,
                  versionToUpdate,
                );
              }}
            >
              Update OS target
            </Button>
          }
        />
      )}
      {isUpdateAvailable && !canUpdateFleet && (
        <Alert
          status="info"
          title="OS update available"
          description={`${nextVersionText} is available, but you don't have permission to update this fleet. Ask an administrator if the OS target should be changed.`}
        />
      )}

      <FleetAlert statusItem={fleetStatusItem} />

      <div className={styles.fleetDetailsPrimaryGrid}>
        <Card className={styles.fleetDetailsCard}>
          <FleetDetailsCardHeader title="OS target" />
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetOsDetails
              osSpec={osSpec}
              catalogItem={catalogItem}
              versionToUpdate={versionToUpdate}
              isFleetEditable={isFleetEditable}
              canUpdateFleet={canUpdateFleet}
            />
          </CardBody>
        </Card>

        <Card className={styles.fleetDetailsCard}>
          <FleetDetailsCardHeader title="Devices" />
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetUpdateStatusDetail fleet={fleet} />
          </CardBody>
        </Card>
        <Card className={styles.fleetDetailsCard}>
          <FleetDetailsCardHeader title="Maintenance window" />
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetMaintenanceWindow
              updatePolicy={updatePolicy}
              canUpdateFleet={canUpdateFleet}
            />
          </CardBody>
        </Card>
      </div>

      <div className={styles.fleetDetailsSecondaryGrid}>
        <Card>
          <FleetDetailsCardHeader
            title="Applications"
            meta={
              apps.length > 0 && (
                <Text variant="body-small" color="secondary">
                  {`${apps.length} on this fleet`}
                </Text>
              )
            }
          />
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetDetailsApplications
              apps={apps}
              catalogItems={fleetCatalogItems}
            />
          </CardBody>
        </Card>

        <FleetEventsCard fleetName={fleetName} />
      </div>
    </Flex>
  );
};

const FleetDetailsPageBody = ({
  canUpdateFleet,
}: {
  canUpdateFleet: boolean;
}) => {
  const { fleetName = '' } = useParams<{ fleetName: string }>();
  const { data: fleet, isLoading, error, refetch } = useFleetDetails(fleetName);
  const fleetUpdateState = useFleetUpdate(refetch);

  if (isLoading) {
    return <Progress />;
  }

  const showLoading = isLoading && !error;
  return (
    <AppLayout
      breadcrumbs={[
        { href: getFleetsPath(), label: 'Fleets' },
        { label: fleetName },
      ]}
      header={
        <AppHeader
          title={fleetName}
          metadata={[
            {
              label: 'Status',
              value: <FleetStatus fleetStatus={fleet?.status} />,
            },
            ...(!canUpdateFleet
              ? [
                  {
                    label: '',
                    value: <ViewOnlyBadge />,
                  },
                ]
              : []),
          ]}
        />
      }
    >
      <Flex direction="column" gap="0">
        {showLoading && <Progress />}
        {error && (
          <Alert status="danger" title="Error loading fleet details">
            {error.message}
          </Alert>
        )}
        {fleet && (
          <FleetDetailsPageContent
            fleet={fleet}
            fleetUpdateState={fleetUpdateState}
          />
        )}
      </Flex>
      <FleetOsUpdateDialog fleetUpdateState={fleetUpdateState} />
    </AppLayout>
  );
};

const FleetDetailsPage = () => {
  const { loading: loadingPermissions, checkPermissions } =
    useUserPermissions();

  if (loadingPermissions) {
    return <Progress />;
  }
  const [canViewFleetDetails, canUpdateFleet] = checkPermissions([
    viewFleetDetailsPermission,
    updateFleetPermission,
  ]);
  if (!canViewFleetDetails) {
    return <AccessDenied />;
  }
  return <FleetDetailsPageBody canUpdateFleet={canUpdateFleet} />;
};

export default FleetDetailsPage;
