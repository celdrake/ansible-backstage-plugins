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
  Table,
  Text,
} from '@backstage/ui';
import { useParams } from 'react-router-dom';
import { Progress } from '@backstage/core-components';
import { RiCloudLine, RiExternalLinkLine } from '@remixicon/react';

import { Fleet } from '@ansible/portal-edge-fleets-poc-common';
import useFleetDetails from '../../hooks/useFleetDetails';
import { getFleetsPath, getRhemHomeUrl } from '../../utils/routes';
import { getNextCatalogItemUpdate } from '../../utils/catalogItems';
import useFleetCatalogItems from '../../hooks/useFleetCatalogItems';
import useFleetUpdate from '../../hooks/useFleetUpdate';
import { formatMaintenanceWindow } from '../../utils/time';
import UpdateAvailableBadge from '../common/UpdateAvailableBadge';

// CELIA-WIP ADD breadcrumbs, buttons, wrapper content etc
// See EdgeShellPage for reference

// CELIA-WIP: ADD LATER       <FleetOsUpdateDialog fleetUpdateState={fleetUpdateState} />

const styles = {
  metaGrid: 'flex flex-col gap-6',
  metaRow: 'flex justify-between items-center',
  rhemBanner: 'flex justify-between items-center',
};

const FleetDetailsPageContent = ({ fleet }: { fleet: Fleet }) => {
  const fleetName = fleet.metadata.name as string;
  const osCatalogRef = fleet.spec.template.spec.os?.catalogItemRef;

  // CELIA-WIP ACTUAL REFETCH FUNCTION NEEDED
  const refetch = () => null;
  const fleetUpdateState = useFleetUpdate(refetch);
  const { catalogItemsState } = useFleetCatalogItems([fleetName]);
  const nextCatalogItemUpdate =
    osCatalogRef &&
    getNextCatalogItemUpdate(osCatalogRef, fleet.osLabel, fleet.osVersion);
  const hasUpdates = nextCatalogItemUpdate !== undefined;

  const updateSchedule = fleet.spec.template.spec.updatePolicy?.updateSchedule;

  return (
    <Flex direction="column" gap="6">
      {hasUpdates && (
        <div>
          <Flex direction="column" gap="1">
            <Text weight="bold">OS update ready</Text>
            <Text variant="body-small" color="secondary">
              Start the OS update here. Install timing follows this fleet&apos;s
              maintenance window in Edge Manager.
            </Text>
          </Flex>
          <Button
            variant="primary"
            onClick={() =>
              fleetUpdateState.openFleetUpdate(
                fleet,
                nextCatalogItemUpdate,
                osCatalogRef?.item || '',
              )
            }
          >
            Update OS target
          </Button>
        </div>
      )}
      CELIA-WIP BLOCKER???
      <div className={styles.metaGrid}>
        <Card>
          <CardHeader title="OS target" />
          <CardBody>
            <div className={styles.metaRow}>
              <Text variant="body-small" color="secondary">
                goal whatever
              </Text>
              <Text weight="bold">os image display</Text>
            </div>
            HAS UPDATES???
            <div className={styles.metaRow}>
              <Text variant="body-small" color="secondary">
                Update
              </Text>
              <UpdateAvailableBadge />
            </div>
            {hasUpdates && (
              <div className={styles.metaRow}>
                <Text variant="body-small" color="secondary">
                  Available
                </Text>
                <Text>
                  {osCatalogRef?.item} {nextCatalogItemUpdate?.version}
                </Text>
              </div>
            )}
            <div className={styles.metaRow}>
              <Text variant="body-small" color="secondary">
                Source
              </Text>
              <Text>source display</Text>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Devices" />
          <CardBody>
            <Text color="secondary">DEVICES NOTE WHATEVER</Text>
            <div className={styles.metaRow}>
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

        {updateSchedule && (
          <Card>
            <CardHeader title="Maintenance window" />
            <CardBody>
              <Text>{formatMaintenanceWindow(updateSchedule)}</Text>
            </CardBody>
          </Card>
        )}
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
