import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { ansibleServiceRef } from '@ansible/backstage-rhaap-common';
import express from 'express';
import { createFlightctlFleetsRouter } from './flightctlFleetsRouter';

export default createBackendPlugin({
  pluginId: 'hello-world',
  register(reg) {
    reg.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        ansibleService: ansibleServiceRef,
      },
      async init({ httpAuth, httpRouter, config, ansibleService }) {
        const router = express.Router();

        router.use(
          createFlightctlFleetsRouter({
            httpAuth,
            ansibleService,
            config,
          }),
        );

        httpRouter.use(
          router as unknown as Parameters<typeof httpRouter.use>[0],
        );
      },
    });
  },
});
