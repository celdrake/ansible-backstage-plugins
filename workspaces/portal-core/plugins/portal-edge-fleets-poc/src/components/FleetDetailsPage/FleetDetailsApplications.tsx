import { Accordion, ButtonLink, Flex, Text } from '@backstage/ui';
import { RiApps2Line, RiExternalLinkLine } from '@remixicon/react';
import {
  AccordionGroup,
  AccordionTrigger,
  AccordionPanel,
} from '@backstage/ui';

import {
  ApplicationProviderSpec,
  AppType,
  CatalogItemRefApplicationProviderSpec,
  CatalogItemRefSpec,
  ImageApplicationProviderSpec,
} from '@ansible/portal-edge-fleets-poc-common';
import { CatalogItem } from '@ansible/portal-edge-fleets-poc-common/alpha';
import { updateFleetPermission } from '../../constants/permissions';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { getRhemHomeUrl } from '../../utils/routes';
import { getNextCatalogItemUpdate } from '../../utils/catalogItems';
import DefaultEmptyState from '../common/DefaultEmptyState';
import ViewField from '../common/ViewField';

import styles from './FleetDetailsApplications.module.css';

const getAppTypeLabel = (appType: AppType) => {
  switch (appType) {
    case AppType.AppTypeCompose:
      return 'Compose';
    case AppType.AppTypeHelm:
      return 'Helm';
    case AppType.AppTypeContainer:
      return 'Single Container';
    case AppType.AppTypeQuadlet:
      return 'Quadlet';
    case AppType.AppTypeVm:
      return 'Virtual Machine (VM)';
    default:
      return appType;
  }
};

const isCatalogRefSpecApp = (
  app: ApplicationProviderSpec,
): app is ApplicationProviderSpec & CatalogItemRefApplicationProviderSpec =>
  'catalogItemRef' in app && Boolean(app.catalogItemRef);

const isManualImageApp = (
  app: ApplicationProviderSpec,
): app is ApplicationProviderSpec & ImageApplicationProviderSpec =>
  'image' in app && Boolean(app.image);

const AppRowSummary = ({
  app,
  isCatalogApp,
}: {
  app: ApplicationProviderSpec;
  isCatalogApp: boolean;
}) => {
  return (
    <div className={styles.fleetApplicationsAccordionTrigger}>
      <Text weight="bold" className={styles.fleetApplicationsAccordionName}>
        {app.name}
      </Text>
      <div className={styles.fleetApplicationsAccordionCell}>
        <span className={styles.fleetAppTypeBadge}>
          {getAppTypeLabel(app.appType)}
        </span>
      </div>
      <div
        className={
          isCatalogApp
            ? styles.fleetAppSourceCatalog
            : styles.fleetAppSourceManual
        }
      >
        {isCatalogApp ? 'Software Catalog' : 'Manual'}
      </div>
    </div>
  );
};

const AppCatalogItemStatus = ({
  appCatalogItemRef,
  catalogItem,
}: {
  appCatalogItemRef: CatalogItemRefSpec | undefined;
  catalogItem: CatalogItem | undefined;
}) => {
  let state = '-';
  if (catalogItem) {
    const nextVersion = getNextCatalogItemUpdate(
      catalogItem,
      appCatalogItemRef?.channel,
      appCatalogItemRef?.version,
    );
    state = nextVersion
      ? `Update available: ${nextVersion.version}`
      : 'Up to date';
  }

  return (
    <Text weight="bold" variant="body-small">
      {state}
    </Text>
  );
};

const findMatchingCatalogItem = (
  appCatalogItemRef: CatalogItemRefSpec | undefined,
  catalogItems: CatalogItem[],
) => {
  if (!appCatalogItemRef) {
    return undefined;
  }
  return catalogItems.find(catalogItem => {
    return (
      catalogItem.metadata.catalog === appCatalogItemRef.catalog &&
      catalogItem.metadata.name === appCatalogItemRef.item
    );
  });
};

const CatalogAppDetails = ({
  catalogItemRef: appCatalogItemRef,
  catalogItems,
}: {
  catalogItemRef: CatalogItemRefSpec;
  catalogItems: CatalogItem[];
}) => {
  const appCatalogItem = findMatchingCatalogItem(
    appCatalogItemRef,
    catalogItems,
  );

  return (
    <>
      {appCatalogItem?.spec.shortDescription && (
        <Text
          variant="body-small"
          color="secondary"
          className={styles.fleetApplicationsAccordionDescription}
        >
          {appCatalogItem?.spec.shortDescription}
        </Text>
      )}
      <div className={styles.fleetAppDetailsGrid}>
        <ViewField label="Version">
          <Text weight="bold" variant="body-small">
            {appCatalogItemRef.version}
          </Text>
        </ViewField>
        {appCatalogItemRef.channel && (
          <ViewField label="Channel">
            <Text variant="body-small">{appCatalogItemRef.channel}</Text>
          </ViewField>
        )}
        {appCatalogItem && (
          <ViewField label="State">
            <AppCatalogItemStatus
              appCatalogItemRef={appCatalogItemRef}
              catalogItem={appCatalogItem}
            />
          </ViewField>
        )}
      </div>
    </>
  );
};

const ManualAppDetails = ({ app }: { app: ApplicationProviderSpec }) => {
  const image = isManualImageApp(app) ? app.image : undefined;
  return (
    <div>
      {image ? (
        <ViewField label="Image">
          <code className={styles.fleetApplicationsManualOsImage}>{image}</code>
        </ViewField>
      ) : (
        <ViewField label="Content">
          <Text variant="body-small">Application is defined inline</Text>
        </ViewField>
      )}
    </div>
  );
};

const FleetApplicationsList = ({
  apps,
  catalogItems,
}: {
  apps: ApplicationProviderSpec[];
  catalogItems: CatalogItem[];
}) => {
  return (
    <div className={styles.fleetApplicationsList}>
      <div className={styles.fleetApplicationsListHeader} aria-hidden>
        <Text
          variant="body-small"
          color="secondary"
          className={styles.fleetApplicationsListHeaderCell}
        >
          Name
        </Text>
        <Text
          variant="body-small"
          color="secondary"
          className={styles.fleetApplicationsListHeaderCell}
        >
          Type
        </Text>
        <Text
          variant="body-small"
          color="secondary"
          className={styles.fleetApplicationsListHeaderCell}
        >
          Source
        </Text>
      </div>
      <AccordionGroup
        allowsMultiple
        className={styles.fleetApplicationsAccordionGroup}
      >
        {apps.map((app, index) => {
          const appId = app.name || `app-${index}`;
          const isCatalogApp = isCatalogRefSpecApp(app);

          return (
            <Accordion key={appId} id={appId}>
              <AccordionTrigger>
                <AppRowSummary app={app} isCatalogApp={isCatalogApp} />
              </AccordionTrigger>
              <AccordionPanel>
                <div className={styles.fleetApplicationsAccordionPanel}>
                  {isCatalogApp ? (
                    <CatalogAppDetails
                      catalogItemRef={app.catalogItemRef}
                      catalogItems={catalogItems}
                    />
                  ) : (
                    <ManualAppDetails app={app} />
                  )}
                </div>
              </AccordionPanel>
            </Accordion>
          );
        })}
      </AccordionGroup>
    </div>
  );
};

const FleetDetailsApplications = ({
  apps,
  catalogItems,
}: {
  apps: ApplicationProviderSpec[];
  catalogItems: CatalogItem[];
}) => {
  const { checkPermissions } = useUserPermissions();
  const [canUpdateFleet] = checkPermissions([updateFleetPermission]);

  if (apps.length === 0) {
    return (
      <DefaultEmptyState
        icon={<RiApps2Line size={28} />}
        title="No applications"
        description={
          canUpdateFleet
            ? 'Add catalog or manual applications to this fleet in Edge Manager. Portal focuses on OS updates.'
            : 'Applications are added in Edge Manager. Portal focuses on OS updates. Ask an administrator if apps should be added to this fleet.'
        }
        actionLabel={canUpdateFleet ? 'Manage apps in Edge Manager' : ''}
      />
    );
  }

  const hasManualApps = apps.some(app => !isCatalogRefSpecApp(app));
  let mainText;
  if (hasManualApps) {
    mainText =
      'Catalog apps show version and channel when available. Manual apps are managed in Edge Manager.';
  } else if (canUpdateFleet) {
    mainText = 'Portal focuses on OS updates. Manage apps in Edge Manager.';
  } else {
    mainText =
      'Portal focuses on OS updates. Application changes are managed in Edge Manager.';
  }

  return (
    <Flex direction="column" gap="4">
      <FleetApplicationsList apps={apps} catalogItems={catalogItems} />
      <Flex align="center" justify="between" gap="4">
        <Text variant="body-small" color="secondary">
          {mainText}
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
  );
};

export default FleetDetailsApplications;
