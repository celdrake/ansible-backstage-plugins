import {
  Content,
  Header,
  Page,
  StatusPending,
  Table,
  type TableColumn,
} from '@backstage/core-components';
import {
  DeviceSummaryStatusType,
  type Fleet,
} from '@ansible/portal-hello-world-common';
import { FLEET_LIST } from './fleetDemoData';

// CELIA-WIP: translations??

const OnlineDevices = ({ fleet }: { fleet: Fleet }) => {
  const summary = fleet.status?.devicesSummary;
  if (!summary) {
    // CELIA-WIP: Discuss the UX for a missing addDevicesSummary response.
    return <StatusPending>WIP</StatusPending>;
  }

  const online =
    summary.summaryStatus[DeviceSummaryStatusType.DeviceSummaryStatusOnline] ??
    0;
  return `${online}/${summary.total} online`;
};

const FleetHealth = ({ fleet }: { fleet: Fleet }) => {
  return <StatusPending>WIP</StatusPending>;
};

const FleetOs = ({ fleet }: { fleet: Fleet }) => {
  const osSpec = fleet.spec.template.spec.os;
  let osImage = '';
  if (osSpec?.image) {
    osImage = osSpec.image;
  }
  if (osSpec?.catalogItemRef) {
    const { catalog, item, version } = osSpec.catalogItemRef;
    osImage = `${catalog}/${item}:${version}`;
  }
  return (
    <div>
      <div>{osImage ?? 'No system image configured'}</div>
      <small>Current version: WIP</small>
      <br />
      <small>Available version: WIP</small>
      <div>
        Update state: <StatusPending>WIP</StatusPending>
      </div>
      <small>Rollout progress: WIP</small>
      <br />
      <small>OS source: WIP</small>
    </div>
  );
};

const columns: TableColumn<Fleet>[] = [
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
    render: fleet => <OnlineDevices fleet={fleet} />,
  },
  {
    title: 'Catalog',
    render: fleet => <FleetOs fleet={fleet} />,
  },
  {
    title: 'Maintenance window',
    render: fleet => 'Sat 02:00 - 06:00 UTC',
  },
  {
    title: 'Actions',
    render: fleet => 'WIP',
  },
];

const FleetsPage = () => {
  return (
    <Page themeId="app">
      <Header
        title="Edge fleets"
        subtitle={`Showing ${FLEET_LIST.items.length} fleets. Device versions, rollout details, and OS source are marked WIP.`}
        pageTitleOverride="Edge fleets"
      />
      <Content>
        <Table<Fleet>
          title=""
          options={{ paging: false, search: true }}
          columns={columns}
          data={FLEET_LIST.items}
        />
      </Content>
    </Page>
  );
};

export default FleetsPage;
