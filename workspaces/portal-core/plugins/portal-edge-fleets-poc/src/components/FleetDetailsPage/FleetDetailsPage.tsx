import {
  Alert,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Header,
  PluginHeader,
  Text,
} from '@backstage/ui';
import { useParams } from 'react-router-dom';
import { Progress } from '@backstage/core-components';
import { RiCloudLine, RiExternalLinkLine } from '@remixicon/react';

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
  getOsCatalogRefDisplayText,
} from '../../utils/catalogItems';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import { formatMaintenanceWindow } from '../../utils/time';
import UpdateAvailableBadge from '../common/UpdateAvailableBadge';

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
    return null;
  }
  return (
    <Card>
      <CardHeader
        title={`"Maintenance window (${
          updateSchedule ? 'Update' : 'Download'
        })"`}
      />
      <CardBody>
        <Text>{formatMaintenanceWindow(schedule)}</Text>
      </CardBody>
    </Card>
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
  const osTitle = osSpec?.catalogItemRef ? 'Target' : 'Image';

  let osContent = null;
  if (osSpec?.catalogItemRef) {
    const osDisplayText =
      catalogItem && versionToUpdate
        ? getOsCatalogItemDisplayText(catalogItem, versionToUpdate?.version)
        : getOsCatalogRefDisplayText(osSpec.catalogItemRef);
    osContent = <Text weight="bold">{osDisplayText}</Text>;
  } else if (osSpec?.image) {
    osContent = <Text weight="bold">{`Custom image · ${osSpec.image}`}</Text>;
  } else {
    osContent = <Text>Not defined</Text>;
  }

  return (
    <div className={styles.metaRow}>
      <Text variant="body-small" color="secondary">
        {osTitle}
      </Text>
      <Text weight="bold">{osContent}</Text>
    </div>
  );
};

const getFleetOsSource = (osSpec: DeviceOsSpec | undefined) => {
  if (osSpec?.catalogItemRef) {
    return 'Managed (updatable from Portal)';
  }
  if (osSpec?.image) {
    return 'Custom image - manage updates in Edge Manager';
  }
  return 'No OS image - link in Edge Manager';
};

const FleetDetailsPageContent = ({ fleet }: { fleet: Fleet }) => {
  const fleetName = fleet.metadata.name as string;
  const osSpec = fleet.spec.template.spec.os;
  const osCatalogRef = osSpec?.catalogItemRef;

  // CELIA-WIP ACTUAL REFETCH FUNCTION NEEDED
  const refetch = () => null;
  const fleetUpdateState = useFleetUpdate(refetch);
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

  const hasUpdates = versionToUpdate !== undefined;
  const updatePolicy = fleet.spec.template.spec.updatePolicy;
  const hasUpdatePolicy = Boolean(
    updatePolicy?.updateSchedule || updatePolicy?.downloadSchedule,
  );

  return (
    <Flex direction="column" gap="6">
      {hasUpdates && (
        <div className={styles.updateAvailableBanner}>
          <Flex direction="column" gap="1">
            <Text weight="bold">OS update ready</Text>
            {hasUpdatePolicy ? (
              <Text variant="body-small" color="secondary">
                Start the OS update here. Install timing follows this
                fleet&apos;s maintenance window in Edge Manager.
              </Text>
            ) : (
              <Text variant="body-small" color="secondary">
                Start the OS update here.
              </Text>
            )}
          </Flex>
          <Button
            variant="primary"
            onClick={() =>
              fleetUpdateState.openFleetUpdate(
                fleet,
                versionToUpdate,
                osCatalogRef?.item || '',
              )
            }
          >
            Update OS target
          </Button>
        </div>
      )}
      CELIA-WIP BLOCKER???
      <div className={styles.fleetDetailsMainRow}>
        <Card>
          <CardHeader title="OS target" />
          <CardBody>
            <FleetOsDetails
              osSpec={osSpec}
              catalogItem={catalogItem}
              versionToUpdate={versionToUpdate}
            />
            {hasUpdates && (
              <div className={styles.fleetDetailsMainRowItem}>
                <Text variant="body-small" color="secondary">
                  Update
                </Text>
                <UpdateAvailableBadge />
                <div className={styles.fleetDetailsMainRowItem}>
                  <Text variant="body-small" color="secondary">
                    Available
                  </Text>
                </div>
                <Text>
                  {osCatalogRef?.item} {versionToUpdate?.version}
                </Text>
              </div>
            )}
            <div className={styles.fleetDetailsMainRowItem}>
              <Text variant="body-small" color="secondary">
                Source
              </Text>
              <Text>{getFleetOsSource(osSpec)}</Text>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Devices" />
          <CardBody>
            <Text color="secondary">DEVICES NOTE WHATEVER</Text>
            <div className={styles.fleetDetailsMainRowItem}>
              <Text variant="body-small" color="secondary">
                Online
              </Text>
              <Text weight="bold">online of total</Text>
            </div>
            FLEET OS PROGRESS BAR WHATEVER
            <Text variant="body-small" color="secondary">
              Device lists and troubleshooting stay in Edge Manager.
            </Text>
          </CardBody>
        </Card>

        <FleetMaintenanceWindow updatePolicy={updatePolicy} />
      </div>
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
  const {
    data: fleet,
    isLoading,
    isUpdating,
    error,
  } = useFleetDetails(fleetName);

  const showLoading = (isLoading && !error) || isUpdating;

  return (
    <Flex direction="column" gap="0">
      <PluginHeader
        title="Fleet details"
        titleLink={getFleetsPath()}
        icon={<RiCloudLine aria-hidden="true" />}
      />
      {showLoading && <Progress />}
      {error && (
        <Alert status="danger" title="Error loading fleet details">
          {error.message}
        </Alert>
      )}
      <Header title={fleetName} />
      {fleet && (
        <Container>
          <FleetDetailsPageContent fleet={fleet} />
        </Container>
      )}
    </Flex>
  );
};

export default FleetDetailsPage;
