import {
  createPlugin,
  createRoutableExtension,
  createRouteRef,
} from '@backstage/core-plugin-api';
import type { ComponentType } from 'react';

import '@backstage/ui/css/styles.css';

import { UserPermissionsProvider } from './hooks/useUserPermissions';
import { ConfigGate } from './utils/configGate';

const rootRouteRef = createRouteRef({ id: 'edge-fleets-poc' });

/** RHDH 1.x entry point. NFS hosts discover the `./alpha` export instead. */
export const edgeFleetsPocPlugin = createPlugin({
  id: 'edge-fleets-poc',
  routes: { root: rootRouteRef },
});

const gatedPage =
  (loader: () => Promise<{ default: ComponentType<any> }>) => async () => {
    const { default: Page } = await loader();
    return () => (
      <ConfigGate>
        <UserPermissionsProvider>
          <Page />
        </UserPermissionsProvider>
      </ConfigGate>
    );
  };

export const EdgeFleetsPage = edgeFleetsPocPlugin.provide(
  createRoutableExtension({
    name: 'EdgeFleetsPage',
    mountPoint: rootRouteRef,
    component: gatedPage(() => import('./components/FleetsPage/FleetsPage')),
  }),
);

export const FleetDetailsPage = edgeFleetsPocPlugin.provide(
  createRoutableExtension({
    name: 'FleetDetailsPage',
    mountPoint: rootRouteRef,
    component: gatedPage(
      () => import('./components/FleetDetailsPage/FleetDetailsPage'),
    ),
  }),
);

export default edgeFleetsPocPlugin;
