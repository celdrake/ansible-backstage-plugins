import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { portalActiveOrganizationServiceRef } from '@ansible/portal-plugin-node';
import { createRouter } from './router';
import { portalPlugin } from './portalPlugin';

export default createBackendPlugin({
  pluginId: 'trust-signals',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
        httpRouter: coreServices.httpRouter,
        organizations: portalActiveOrganizationServiceRef,
      },
      async init({ logger, httpAuth, userInfo, httpRouter, organizations }) {
        portalPlugin.pushHealthStatus({
          state: 'UNKNOWN',
          message: 'Initializing...',
        });
        logger.info('trust-signals: starting backend');

        const router = createRouter({
          httpAuth,
          userInfo,
          logger,
          organizations,
        });
        httpRouter.use(
          router as unknown as Parameters<typeof httpRouter.use>[0],
        );

        portalPlugin.pushHealthStatus({
          state: 'READY',
          message: 'Trust Signals sample route is ready.',
        });
      },
    });
  },
});
