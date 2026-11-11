import { ButtonLink, Flex, Text } from '@backstage/ui';
import { RiApps2Line, RiExternalLinkLine } from '@remixicon/react';

import { ApplicationProviderSpec } from '@ansible/portal-edge-fleets-poc-common';
import { getRhemHomeUrl } from '../../utils/routes';
import DefaultEmptyState from '../common/DefaultEmptyState';

const FleetDetailsApplications = ({
  apps,
}: {
  apps: ApplicationProviderSpec[];
}) => {
  if (apps.length === 0) {
    return (
      <DefaultEmptyState
        icon={<RiApps2Line size={28} />}
        title="No applications"
        description="Add catalog or manual applications to this fleet in Edge Manager. Portal focuses on OS updates."
        actionLabel="Manage apps in Edge Manager"
      />
    );
  }
  return (
    <Flex direction="column" gap="4">
      <Text color="secondary">
        Applications on this fleet — versions and posture at a glance. Update,
        configure, and troubleshoot apps in Red Hat Edge Manager.
      </Text>
      APPS HERE
      <Flex align="center" justify="between" gap="4">
        <Text variant="body-small" color="secondary">
          Portal focuses on OS updates for this fleet. Open Edge Manager for the
          full application experience.
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
