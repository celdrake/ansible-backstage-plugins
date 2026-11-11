import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
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
import { getOsCatalogItem, getOsDisplayText } from '../../utils/catalogItems';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import type { UseFleetUpdateState } from '../../hooks/useFleetUpdate';
import UpdateAvailableBadge from '../common/UpdateAvailableBadge';
import StatusBadge from '../common/StatusBadge';
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
import FleetUpdatePolicyDetails from '../common/FleetUpdatePolicyDetails';
import FleetUpdateStatusDetail from './FleetUpdateStatusDetail';
import FleetDetailsApplications from './FleetDetailsApplications';
import FleetDetailsEvents from './FleetDetailsEvents';
import styles from './FleetDetailsPage.module.css';

const FleetMaintenanceWindow = ({
  updatePolicy,
}: {
  updatePolicy: DeviceUpdatePolicySpec | undefined;
}) => {
  const updateSchedule = updatePolicy?.updateSchedule;
  const downloadSchedule = updatePolicy?.downloadSchedule;
  const schedule = updateSchedule || downloadSchedule;
  if (!schedule) {
    return (
      <DefaultEmptyState
        icon={<RiSettings3Line size={28} />}
        title="No maintenance window"
        description="Devices receive updates as soon as they are available. Set a window in Edge Manager to control download and install timing."
        actionLabel="Set window in Edge Manager"
      />
    );
  }

  return (
    <FleetUpdatePolicyDetails updatePolicy={updatePolicy} asSeparateBlocks />
  );
};

// CELIA-WIP: what's the purpose of this component and does it name make sense?
const SomeField = ({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) => {
  return (
    <div className={styles.fleetOsExtraField}>
      <Text
        variant="body-small"
        color="secondary"
        className={styles.fleetOsExtraFieldLabel}
      >
        {label}
      </Text>
      <div className={styles.fleetOsExtraFieldValue}>{children}</div>
    </div>
  );
};

// CELIA-WIP: Check overall layout and responsiveness

const FleetOsDetails = ({
  osSpec,
  catalogItem,
  versionToUpdate,
  canUpdate,
}: {
  osSpec: DeviceOsSpec | undefined;
  catalogItem: CatalogItem | undefined;
  versionToUpdate: CatalogItemVersion | undefined;
  canUpdate: boolean;
}) => {
  if (!osSpec?.catalogItemRef && !osSpec?.image) {
    return (
      <DefaultEmptyState
        icon={<RiHardDrive3Line size={28} />}
        title="No OS defined"
        description="Assign a Software Catalog OS in Edge Manager to unlock Portal OS targets and rollouts."
        actionLabel="Assign OS in Edge Manager"
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

        {versionToUpdate && canUpdate && <UpdateAvailableBadge />}
        {osMode === 'catalog' && !versionToUpdate && (
          <StatusBadge text="Up to date" />
        )}
      </div>
      <div className={styles.fleetOsExtraSection}>
        <SomeField label="Source">
          <Text weight="bold">{getOsSourceLabel(osMode)}</Text>
        </SomeField>
        {nextVersion && (
          <SomeField label="Available">
            <Text weight="bold">{nextVersion}</Text>
          </SomeField>
        )}
        {osSpec?.image && (
          <SomeField label="Updates">
            <Text color="secondary">
              Portal cannot change a manual OS image
            </Text>
          </SomeField>
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

const FleetDetailsCardHeader = ({
  title,
  meta,
  description,
}: {
  title: string;
  meta?: React.ReactNode;
  description?: React.ReactNode;
}) => {
  return (
    <CardHeader>
      <Flex direction="column" gap="1" className={styles.fleetDetailsCardTitle}>
        <Flex justify="between" align="center" gap="3">
          <Text weight="bold">{title}</Text>
          {meta && (
            <div className={styles.fleetDetailsCardTitleMeta}>{meta}</div>
          )}
        </Flex>
        {description && (
          <Text variant="body-small" color="secondary">
            {description}
          </Text>
        )}
      </Flex>
    </CardHeader>
  );
};

// CELIA-WIP: User permissions

const FleetDetailsPageContent = ({
  fleet,
  fleetUpdateState,
}: {
  fleet: Fleet;
  fleetUpdateState: UseFleetUpdateState;
}) => {
  const fleetName = fleet.metadata.name as string;
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

  const { catalogItem, versionToUpdate } = osCatalogRef
    ? getOsCatalogItem(osCatalogRef, catalogItemsState.catalogItemsList.items)
    : { catalogItem: undefined, versionToUpdate: undefined };

  // CELIA-WIP: Design wants to block updates if the fleet is invalid
  const hasUpdates = versionToUpdate !== undefined;
  const updatePolicy = fleet.spec.template.spec.updatePolicy;
  const hasUpdatePolicy = Boolean(
    updatePolicy?.updateSchedule || updatePolicy?.downloadSchedule,
  );

  const apps = fleet.spec.template.spec.applications || [];

  const fleetStatusItem = getFleetStatusItem(fleet.status);
  const canUpdate = hasUpdates && fleetStatusItem.id === 'Valid';

  return (
    <Flex direction="column" gap="6">
      {canUpdate && (
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

      <FleetAlert statusItem={fleetStatusItem} />

      <div className={styles.fleetDetailsPrimaryGrid}>
        <Card className={styles.fleetDetailsCard}>
          <FleetDetailsCardHeader title="OS target" />
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetOsDetails
              osSpec={osSpec}
              catalogItem={catalogItem}
              versionToUpdate={versionToUpdate}
              canUpdate={canUpdate}
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
            <FleetMaintenanceWindow updatePolicy={updatePolicy} />
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
            <FleetDetailsApplications apps={apps} />
          </CardBody>
        </Card>
        <Card>
          <FleetDetailsCardHeader title="Events" />
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetDetailsEvents />
          </CardBody>
        </Card>
      </div>
    </Flex>
  );
};

// CELIA-WIP CHECK PAGE STRUCTURE, TITLE FONT SIZE IS NOT CORRECT
const FleetDetailsPage = () => {
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

export default FleetDetailsPage;
