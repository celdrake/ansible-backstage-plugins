import express from 'express';
import type {
  HttpAuthService,
  LoggerService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import type { ActiveOrganizationResolver } from '@ansible/portal-plugin-node';
import { portalPlugin } from './portalPlugin';

type TrustSignal = {
  id: string;
  label: string;
  status: 'PASS' | 'NOT_CONFIGURED';
  summary: string;
};

type TrustSignalsResponse = {
  demo: true;
  repositoryId: string;
  organizationId: string;
  signals: TrustSignal[];
};

/** Local fixture standing in for the product-specific trust service. */
async function fetchTrustSignals(options: {
  organizationId: string;
  repoId: string;
}): Promise<TrustSignalsResponse> {
  return {
    demo: true,
    repositoryId: options.repoId,
    organizationId: options.organizationId,
    signals: [
      {
        id: 'catalog-metadata',
        label: 'Catalog metadata',
        status: 'PASS',
        summary: 'The repository was resolved from the Backstage catalog.',
      },
      {
        id: 'signed-commits',
        label: 'Signed commits',
        status: 'NOT_CONFIGURED',
        summary: 'No commit-signing provider is configured in this example.',
      },
    ],
  };
}

export function createRouter(options: {
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  logger: LoggerService;
  organizations: ActiveOrganizationResolver;
}): express.Router {
  const router = express.Router();

  router.use(portalPlugin.createMiddleware(options));

  router.get('/trust-signals/:repoId', async (req, res) => {
    const { repoId } = req.params;
    const context = req.portalContext;
    if (!context) {
      res
        .status(401)
        .json({ error: 'Authenticated Portal context is required' });
      return;
    }
    if (!context.organizationId) {
      res
        .status(403)
        .json({ error: 'A single validated organization is required' });
      return;
    }

    const signals = await fetchTrustSignals({
      organizationId: context.organizationId,
      repoId,
    });

    portalPlugin.emitAuditEvent({
      operationId: 'trust-signals.repository.read',
      userId: context.userId,
      organizationId: context.organizationId,
      input: { repoId },
      outcome: 'SUCCESS',
    });

    res.json(signals);
  });

  return router;
}
