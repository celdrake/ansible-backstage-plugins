import {
  Content,
  Header,
  Page,
  StatusOK,
  StatusPending,
  StatusRunning,
  StatusWarning,
  Table,
  type TableColumn,
} from '@backstage/core-components';
import {
  EDGE_FLEETS,
  type EdgeFleet,
  type EdgeUpdateState,
} from './fleetDemoData';

function OsUpdateStatus({ state }: { state: EdgeUpdateState }) {
  switch (state) {
    case 'up-to-date':
      return <StatusOK>Up to date</StatusOK>;
    case 'available':
      return <StatusWarning>Update available</StatusWarning>;
    case 'scheduled':
      return <StatusPending>Scheduled</StatusPending>;
    case 'updating':
      return <StatusRunning>Updating</StatusRunning>;
    default: {
      const exhaustiveCheck: never = state;
      return exhaustiveCheck;
    }
  }
}

const columns: TableColumn<EdgeFleet>[] = [
  {
    title: 'Fleet',
    field: 'name',
    highlight: true,
    render: fleet => (
      <div>
        <strong>{fleet.name}</strong>
        <br />
        <small>{fleet.description}</small>
      </div>
    ),
  },
  {
    title: 'Devices',
    field: 'devicesOnline',
    render: fleet => `${fleet.devicesOnline}/${fleet.devicesTotal} online`,
  },
  {
    title: 'Operating system',
    field: 'osLabel',
    render: fleet => (
      <div>
        <OsUpdateStatus state={fleet.osUpdateState} />
        <div>
          {fleet.osLabel} {fleet.currentVersion}
          {fleet.availableVersion && ` → ${fleet.availableVersion}`}
        </div>
        {fleet.osRolloutProgress && <small>{fleet.osRolloutProgress}</small>}
      </div>
    ),
  },
];

export function FleetsPage() {
  return (
    <Page themeId="app">
      <Header
        title="Edge fleets"
        subtitle={`Showing ${EDGE_FLEETS.length} fleets. Review device connectivity and operating system update status.`}
        pageTitleOverride="Edge fleets"
      />
      <Content>
        <Table<EdgeFleet>
          title=""
          options={{ paging: false, search: true }}
          columns={columns}
          data={EDGE_FLEETS}
        />
      </Content>
    </Page>
  );
}
