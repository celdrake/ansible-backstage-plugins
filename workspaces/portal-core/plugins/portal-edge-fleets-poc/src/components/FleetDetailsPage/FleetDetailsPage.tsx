import { Alert, Container, Flex, PluginHeader } from '@backstage/ui';
import { useParams } from 'react-router-dom';
import { Progress } from '@backstage/core-components';

import { RiCloudLine } from '@remixicon/react';

import useFleetDetails from '../../hooks/useFleetDetails';
import { getFleetsPath } from '../../utils/routes';

// CELIA-WIP ADD breadcrumbs, buttons, wrapper content etc
// See EdgeShellPage for reference

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
      {fleet && <Container>{fleetName}</Container>}
    </Flex>
  );
};

export default FleetDetailsPage;
