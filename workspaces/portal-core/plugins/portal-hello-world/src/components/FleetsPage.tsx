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

const devicesOnline = (fleet: Fleet) => {
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

const desiredSystemImage = (fleet: Fleet): string => {
  const os = fleet.spec.template.spec.os;
  if (os?.image) return os.image;
  if (os?.catalogItemRef) {
    const { catalog, item, version } = os.catalogItemRef;
    return `${catalog}/${item}:${version}`;
  }
  return 'No system image configured';
};

const columns: TableColumn<Fleet>[] = [
  {
    title: 'Fleet',
    field: 'metadata.name',
    highlight: true,
    render: fleet => <strong>{fleet.metadata.name as string}</strong>,
  },
  {
    title: 'Devices',
    render: fleet => devicesOnline(fleet),
  },
  {
    title: 'Operating system',
    render: fleet => (
      <div>
        <div>{desiredSystemImage(fleet)}</div>
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
    ),
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
