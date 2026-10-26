import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import express from 'express';
import type { HttpAuthService } from '@backstage/backend-plugin-api';

export default createBackendPlugin({
  pluginId: 'hello-world',
  register(reg) {
    reg.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        userInfo: coreServices.userInfo,
      },
      async init({ httpAuth, httpRouter, userInfo }) {
        const router = express.Router();

        router.get('/whoami', async (req, res) => {
          const credentials = await httpAuth.credentials(
            req as unknown as Parameters<HttpAuthService['credentials']>[0],
            { allow: ['user'] },
          );
          const identity = await userInfo.getUserInfo(credentials);
          res.json({ authenticated: true, ...identity });
        });

        httpRouter.use(
          router as unknown as Parameters<typeof httpRouter.use>[0],
        );
      },
    });
  },
});
