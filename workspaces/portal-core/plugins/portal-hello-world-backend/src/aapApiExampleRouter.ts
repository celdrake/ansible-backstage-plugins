import type {
  HttpAuthService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { AuthenticationError } from '@backstage/errors';
import type { IAAPService } from '@ansible/backstage-rhaap-common';
import { toUserEntityRef } from '@ansible/backstage-rhaap-common';
import express from 'express';

type AapOrganization = {
  externalOrgId: string;
  name: string;
  internalOrgId?: string;
};

function readAapToken(req: express.Request): string | undefined {
  const value = req.header('x-rhaap-access-token')?.trim();
  return value || undefined;
}

function readOrganizationMappings(config: Config): Map<string, string> {
  const rows =
    config.getOptionalConfigArray(
      'ansible.hello-world.aapApi.organizationMappings',
    ) ?? [];
  const mappings = new Map<string, string>();

  for (const row of rows) {
    const externalOrgId = row.getString('externalOrgId').trim();
    const internalOrgId = row.getString('internalOrgId').trim();
    if (!externalOrgId || !internalOrgId || mappings.has(externalOrgId)) {
      throw new Error('AAP organization mappings must be non-empty and unique');
    }
    mappings.set(externalOrgId, internalOrgId);
  }

  return mappings;
}

function isMultiOrgEnabled(config: Config): boolean {
  const providers = config.getOptionalConfig('catalog.providers.rhaap');
  return (
    providers
      ?.keys()
      .some(
        key =>
          providers.getConfig(key).getOptionalBoolean('multiOrgEnabled') ===
          true,
      ) ?? false
  );
}

export async function readUserOrganizations(options: {
  req: express.Request;
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  ansibleService: IAAPService;
  config: Config;
}): Promise<{ accessToken: string; organizations: AapOrganization[] }> {
  const accessToken = readAapToken(options.req);
  if (!accessToken) {
    throw new AuthenticationError(
      'AAP sign-in is required to read AAP organizations.',
    );
  }

  const credentials = await options.httpAuth.credentials(
    options.req as unknown as Parameters<HttpAuthService['credentials']>[0],
    { allow: ['user'] },
  );
  const backstageUser = await options.userInfo.getUserInfo(credentials);
  const profile = await options.ansibleService.fetchProfile(accessToken);
  const aapUserId = Number(profile.id);

  if (
    !profile.username ||
    !Number.isSafeInteger(aapUserId) ||
    aapUserId < 1
  ) {
    throw new AuthenticationError('AAP returned an invalid user profile.');
  }

  const expectedUserRef = toUserEntityRef(profile.username, aapUserId, {
    multiOrgEnabled: isMultiOrgEnabled(options.config),
  });
  if (
    backstageUser.userEntityRef.toLowerCase() !== expectedUserRef.toLowerCase()
  ) {
    throw new AuthenticationError(
      'The AAP session does not match the signed-in Backstage user.',
    );
  }

  const response = await options.ansibleService.executeGetRequest(
    `api/gateway/v1/users/${aapUserId}/organizations/?page_size=200`,
    accessToken,
  );
  const payload = await response.json();
  let results: unknown[];
  if (Array.isArray(payload)) {
    results = payload;
  } else if (Array.isArray(payload?.results)) {
    results = payload.results;
  } else {
    results = [];
  }
  const mappings = readOrganizationMappings(options.config);

  const organizations = results
    .filter(
      (item): item is { id: string | number; name: string } =>
        !!item &&
        typeof item === 'object' &&
        (typeof (item as { id?: unknown }).id === 'string' ||
          typeof (item as { id?: unknown }).id === 'number') &&
        typeof (item as { name?: unknown }).name === 'string',
    )
    .map(item => {
      const externalOrgId = String(item.id);
      return {
        externalOrgId,
        name: item.name,
        internalOrgId: mappings.get(externalOrgId),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return { accessToken, organizations };
}

async function sendAapApiRequest(options: {
  accessToken: string;
  internalOrgId: string;
  config: Config;
}): Promise<{ status: number; body: unknown }> {
  const apiBaseUrl = options.config.getOptionalString(
    'ansible.hello-world.aapApi.apiBaseUrl',
  );
  if (!apiBaseUrl) {
    throw new Error(
      'Configure ansible.hello-world.aapApi.apiBaseUrl before calling the example API.',
    );
  }

  const apiPath =
    options.config.getOptionalString('ansible.hello-world.aapApi.apiPath') ??
    '/example';
  const url = new URL(apiPath, apiBaseUrl);
  url.searchParams.set('orgId', options.internalOrgId);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${options.accessToken}`,
    },
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Preserve non-JSON API responses as text for this example.
  }

  return { status: response.status, body };
}

export function createAapApiExampleRouter(options: {
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  ansibleService: IAAPService;
  config: Config;
}): express.Router {
  const router = express.Router();

  router.get('/aap-organizations', async (req, res) => {
    try {
      const result = await readUserOrganizations({ ...options, req });
      res.json({ organizations: result.organizations });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to resolve AAP organizations.';
      const status = error instanceof AuthenticationError ? 401 : 502;
      res.status(status).json({ error: message });
    }
  });

  router.get('/aap-api-example', async (req, res) => {
    const externalOrgId = req.query.externalOrgId;
    if (typeof externalOrgId !== 'string' || !externalOrgId.trim()) {
      res.status(400).json({ error: 'externalOrgId is required.' });
      return;
    }

    try {
      const { accessToken, organizations } = await readUserOrganizations({
        ...options,
        req,
      });
      const organization = organizations.find(
        item => item.externalOrgId === externalOrgId,
      );
      if (!organization) {
        res.status(403).json({
          error:
            'The selected AAP organization is not available to this user.',
        });
        return;
      }
      if (!organization.internalOrgId) {
        res.status(403).json({
          error:
            'No internal API organization mapping is configured for this AAP organization.',
        });
        return;
      }

      const result = await sendAapApiRequest({
        accessToken,
        internalOrgId: organization.internalOrgId,
        config: options.config,
      });
      if (result.status < 200 || result.status >= 300) {
        res.status(502).json({
          error: `The application API returned HTTP ${result.status}.`,
          externalOrgId: organization.externalOrgId,
          internalOrgId: organization.internalOrgId,
        });
        return;
      }

      res.json({
        externalOrgId: organization.externalOrgId,
        internalOrgId: organization.internalOrgId,
        apiStatus: result.status,
        result: result.body,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to call the application API.';
      const status = error instanceof AuthenticationError ? 401 : 502;
      res.status(status).json({ error: message });
    }
  });

  return router;
}
