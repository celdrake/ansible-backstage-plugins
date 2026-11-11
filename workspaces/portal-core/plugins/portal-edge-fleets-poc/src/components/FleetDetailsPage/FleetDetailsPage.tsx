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
import { RiExternalLinkLine } from '@remixicon/react';

import {
  CatalogItemRefSpec,
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
  getOsCatalogRefDisplayText,
  getOsDisplayText,
} from '../../utils/catalogItems';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import type { UseFleetUpdateState } from '../../hooks/useFleetUpdate';
import { extractUpdateScheduleParts } from '../../utils/updatePolicy';
import UpdateAvailableBadge from '../common/UpdateAvailableBadge';
import CurrentStatusBadge from '../common/CurrentStatusBadge';
import AppLayout from '../Layout/AppLayout';
import AppHeader from '../Layout/AppHeader';
import FleetStatus, { getFleetStatusItem } from '../FleetsPage/FleetStatus';
import FleetOsUpdateDialog from '../FleetsPage/FleetOsUpdateDialog';
import styles from './FleetDetailsPage.module.css';
import {
  getFleetOsMode,
  getFleetOsSourceDetail,
  getOsSourceLabel,
  OsType,
} from '../../utils/os';
import FleetUpdateStatusDetail from './FleetUpdateStatusDetail';

const FleetMaintenanceWindow = ({
  updatePolicy,
}: {
  updatePolicy: DeviceUpdatePolicySpec | undefined;
}) => {
  const updateSchedule = updatePolicy?.updateSchedule;
  const downloadSchedule = updatePolicy?.downloadSchedule;
  const schedule = updateSchedule || downloadSchedule;
  if (!schedule) {
    return null;
  }
  const scheduleParts = extractUpdateScheduleParts(schedule);
  if (!scheduleParts) {
    return 'TBD NO PARTS';
  }

  // CELIA-WIP: CHECK WITH NEW DESIGN
  return (
    <Card>
      <CardHeader
        title={`"Maintenance window (${
          updateSchedule ? 'Update' : 'Download'
        })"`}
      />
      <CardBody>
        <Text>{`${scheduleParts.daysOfWeek.join(', ')} at ${
          scheduleParts.time
        }`}</Text>
      </CardBody>
    </Card>
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

const FleetOsDetails = ({
  osSpec,
  catalogItem,
  versionToUpdate,
}: {
  osSpec: DeviceOsSpec | undefined;
  catalogItem: CatalogItem | undefined;
  versionToUpdate: CatalogItemVersion | undefined;
}) => {
  let currentVersion = null;
  let nextVersion = null;
  let osMode: OsType | null = null;
  if (osSpec?.catalogItemRef) {
    osMode = 'catalog';
    const { currentVersionText, nextVersionText } = getOsDisplayText(
      osSpec.catalogItemRef,
      catalogItem,
      versionToUpdate,
    );
    currentVersion = currentVersionText;
    nextVersion = nextVersionText;
  } else if (osSpec?.image) {
    osMode = 'custom';
    currentVersion = osSpec.image;
  } else {
    osMode = 'none';
    currentVersion = 'No OS image defined';
  }

  return (
    <>
      <div className={styles.fleetTargetOs}>
        <Text as="strong" variant="body-medium" weight="bold">
          {currentVersion}
        </Text>

        {versionToUpdate ? (
          <UpdateAvailableBadge />
        ) : osSpec?.catalogItemRef ? (
          <CurrentStatusBadge text="Current" />
        ) : null}
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
        {!osSpec?.catalogItemRef && (
          <SomeField label="Updates">
            <Text color="secondary">
              {osSpec?.image
                ? 'Custom image - manage updates in Edge Manager'
                : 'No OS image defined'}
            </Text>
          </SomeField>
        )}
      </div>
    </>
  );
};

const FleetAlert = ({ fleet }: { fleet: Fleet }) => {
  const fleetStatusItem = getFleetStatusItem(fleet.status);

  let title;
  let description;
  if (fleetStatusItem.id === 'Invalid') {
    title = 'Fleet invalid';
    description =
      'Fleet specification problem - OS updates are unavailable. Check with an administrator or open Edge Manager';
  } else if (fleetStatusItem.id === 'SyncPending') {
    title = 'Sync pending';
    description =
      'Fleet is still connecting or validating. OS updates are unavailable until status is valid.';
  } else {
    const osSpec = fleet.spec.template.spec.os;
    if (osSpec?.image) {
      title = 'Custom image · Manage updates in Edge Manager';
      description =
        'Shows how many devices match the fleet OS image. Manage image changes in Edge Manager.';
    } else if (!osSpec?.catalogItemRef) {
      title = 'No OS image defined';
      description = 'OS image can be assigned in Edge Manager.';
    }
  }

  return title ? (
    <Alert status="warning" title={title} description={description} />
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

  const osMode = getFleetOsMode(fleet);

  return (
    <Flex direction="column" gap="6">
      {hasUpdates && (
        <div className={styles.updateAvailableBanner}>
          <Flex direction="column" gap="1">
            <Text weight="bold">OS update ready</Text>
            {hasUpdatePolicy ? (
              <Text variant="body-small" color="secondary">
                Set a new catalog OS target here. Fleet updates now. Pending OS
                and other fleet changes apply on devices during the next
                maintenance window - managed in Edge Manager.
              </Text>
            ) : (
              <Text variant="body-small" color="secondary">
                Set a new catalog OS target here. No maintenance window is set.
                Fleet updates now and devices reconcile the new OS target as
                they connect.
              </Text>
            )}
          </Flex>
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
        </div>
      )}
      <FleetAlert fleet={fleet} />
      <div className={styles.fleetDetailsMainRow}>
        <Card className={styles.fleetDetailsCard}>
          <FleetDetailsCardHeader title="OS target" />
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetOsDetails
              osSpec={osSpec}
              catalogItem={catalogItem}
              versionToUpdate={versionToUpdate}
            />
            <Text
              variant="body-small"
              color="secondary"
              className={styles.fleetOsSourceNote}
            >
              {getFleetOsSourceDetail(osMode)}
            </Text>
          </CardBody>
        </Card>

        <Card className={styles.fleetDetailsCard}>
          <CardHeader>
            <FleetDetailsCardHeader title="Devices" />
          </CardHeader>
          <CardBody className={styles.fleetDetailsCardBody}>
            <FleetUpdateStatusDetail fleet={fleet} />
          </CardBody>
        </Card>
      </div>

      <Card className={styles.fleetDetailsCard}>
        <CardHeader>
          <FleetDetailsCardHeader title="Maintenance window" />
        </CardHeader>
        <CardBody className={styles.fleetDetailsCardBody}>
          <FleetMaintenanceWindow updatePolicy={updatePolicy} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Applications" />
        <CardBody>
          <Flex direction="column" gap="4">
            <Text color="secondary">
              Applications on this fleet — versions and posture at a glance.
              Update, configure, and troubleshoot apps in Red Hat Edge Manager.
            </Text>
            APPS HERE
            <Flex
              align="center"
              justify="between"
              gap="4"
              className={styles.rhemBanner}
            >
              <Text variant="body-small" color="secondary">
                Portal focuses on OS updates for this fleet. Open Edge Manager
                for the full application experience.
              </Text>
              <ButtonLink
                variant="secondary"
                href={getRhemHomeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                iconEnd={<RiExternalLinkLine aria-hidden />}
              >
                Open Edge Manager
              </ButtonLink>
            </Flex>
          </Flex>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Update activity" />
        <CardBody>
          TODO
          <Text variant="body-small" color="secondary">
            Device-level diagnostics stay in Edge Manager. This timeline shows
            fleet OS update milestones started from Portal.
          </Text>
        </CardBody>
      </Card>
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
