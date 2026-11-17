import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import {
  createPortalPlugin,
  portalActiveOrganizationServiceRef,
  portalHealthServiceRef,
} from '@ansible/portal-plugin-node';
import express from 'express';
import { createFlightctlFleetsRouter } from './flightctlFleetsRouter';

export default createBackendPlugin({
  pluginId: 'edge-fleets-poc',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        organizations: portalActiveOrganizationServiceRef,
        health: portalHealthServiceRef,
      },
      async init({
        logger,
        httpAuth,
        userInfo,
        httpRouter,
        config,
        organizations,
        health,
      }) {
        const portalPlugin = createPortalPlugin({
          pluginId: 'edge-fleets-poc',
          health,
        });
        portalPlugin.pushHealthStatus({
          state: 'UNKNOWN',
          message: 'Initializing...',
        });
        logger.info('edge-fleets-poc: starting backend');

        const router = express.Router();

        router.use(
          createFlightctlFleetsRouter({
            portalPlugin,
            httpAuth,
            userInfo,
            logger,
            organizations,
            config,
          }),
        );

        httpRouter.use(
          router as unknown as Parameters<typeof httpRouter.use>[0],
        );

        const flightctlConfigured = Boolean(
          config.getOptionalString(
            'ansible.edge-fleets-poc.flightctl.apiBaseUrl',
          ),
        );
        portalPlugin.pushHealthStatus({
          state: flightctlConfigured ? 'READY' : 'DEGRADED',
          message: flightctlConfigured
            ? 'Edge Fleets routes are ready.'
            : 'Flightctl endpoint is not configured.',
        });
      },
    });
  },
});
