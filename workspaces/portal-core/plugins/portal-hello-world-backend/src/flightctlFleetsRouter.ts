import type { HttpAuthService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { AuthenticationError } from '@backstage/errors';
import type { IAAPService } from '@ansible/backstage-rhaap-common';
import type { CatalogItemList } from '@ansible/portal-hello-world-common/alpha';
import * as https from 'node:https';
import express from 'express';
import { readUserOrganizations } from './aapAuth';

type FlightctlRequestOptions = {
  apiBaseUrl: string;
  accessToken: string;
  organizationId: string;
  skipTlsVerify: boolean;
};

type FlightctlRouterOptions = {
  httpAuth: HttpAuthService;
  ansibleService: IAAPService;
  config: Config;
};

type FlightctlApiResult = { status: number; body: unknown };

class FlightctlRouteError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

// Temporary AAP-to-Flightctl organization mapping until the mapping API exists.
const FLIGHTCTL_AAP_ORGANIZATION_ID = '1';

const MAX_FLEET_NAMES_PER_SELECTOR = 100;
const MAX_FLEET_NAME_LENGTH = 253;
const FLEET_NAME_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;

async function flightctlApiCall(
  url: URL,
  options: FlightctlRequestOptions,
): Promise<FlightctlApiResult> {
  if (url.protocol !== 'https:') {
    throw new Error('The Flightctl API URL must use HTTPS.');
  }

  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${options.accessToken}`,
        },
        rejectUnauthorized: !options.skipTlsVerify,
      },
      response => {
        response.setEncoding('utf8');
        let responseText = '';
        response.on('data', (chunk: string) => {
          responseText += chunk;
        });
        response.on('end', () => {
          let body: unknown = responseText;
          if (responseText) {
            try {
              body = JSON.parse(responseText);
            } catch {
              // Return non-JSON errors as text so the UI can show them.
            }
          }
          resolve({ status: response.statusCode ?? 502, body });
        });
      },
    );

    request.setTimeout(30_000, () => {
      request.destroy(new Error('Flightctl API request timed out.'));
    });
    request.on('error', reject);
    request.end();
  });
}

// Retrieves the fleets.
async function fetchFleets(
  options: FlightctlRequestOptions,
): Promise<FlightctlApiResult> {
  const url = new URL('/api/v1/fleets', options.apiBaseUrl);
  url.searchParams.set('org_id', options.organizationId);
  url.searchParams.set('addDevicesSummary', 'true');

  return flightctlApiCall(url, options);
}

// Retrieves the catalog items associated to the given fleet names.
async function fetchCatalogItems(
  options: FlightctlRequestOptions,
  fleetNames: string[],
): Promise<FlightctlApiResult> {
  const url = new URL('/api/v1/catalogitems', options.apiBaseUrl);
  url.searchParams.set('org_id', options.organizationId);
  url.searchParams.set('fieldSelector', `fleet in (${fleetNames.join(',')})`);

  const result = await flightctlApiCall(url, options);
  if (result.status < 200 || result.status >= 300) {
    return result;
  }

  const list = result.body as CatalogItemList;
  if (!list || typeof list !== 'object' || !Array.isArray(list.items)) {
    return {
      status: 502,
      body: { error: 'Flightctl returned an invalid catalog item list.' },
    };
  }

  return result;
}

function readFleetNames(req: express.Request): string[] | undefined {
  const rawValues = Array.isArray(req.query.fleet)
    ? req.query.fleet
    : [req.query.fleet];
  const values = rawValues.filter(
    (value): value is string => typeof value === 'string',
  );

  const uniqueValues = Array.from(new Set(values));
  if (
    values.length === 0 ||
    values.length !== rawValues.length ||
    uniqueValues.length > MAX_FLEET_NAMES_PER_SELECTOR ||
    values.some(
      name =>
        name.length > MAX_FLEET_NAME_LENGTH || !FLEET_NAME_PATTERN.test(name),
    )
  ) {
    return undefined;
  }

  return uniqueValues;
}

async function resolveFlightctlRequestOptions(
  req: express.Request,
  options: FlightctlRouterOptions,
): Promise<FlightctlRequestOptions> {
  const apiBaseUrl = options.config.getOptionalString(
    'ansible.hello-world.flightctl.apiBaseUrl',
  );
  const configuredOrganizationId = options.config
    .getOptionalString('ansible.hello-world.flightctl.organizationId')
    ?.trim();
  if (!apiBaseUrl || !configuredOrganizationId) {
    throw new FlightctlRouteError(
      500,
      'Configure ansible.hello-world.flightctl.apiBaseUrl and organizationId.',
    );
  }

  const { accessToken, organizations } = await readUserOrganizations({
    req,
    httpAuth: options.httpAuth,
    ansibleService: options.ansibleService,
  });
  const organization = organizations.find(
    item => item.externalOrgId === FLIGHTCTL_AAP_ORGANIZATION_ID,
  );
  if (!organization) {
    throw new FlightctlRouteError(
      403,
      'The AAP user does not have access to the configured Flightctl organization.',
    );
  }

  return {
    apiBaseUrl,
    organizationId: configuredOrganizationId,
    accessToken,
    skipTlsVerify:
      options.config.getOptionalBoolean(
        'ansible.hello-world.flightctl.skipTlsVerify',
      ) ?? false,
  };
}

async function proxyFlightctlRequest(
  req: express.Request,
  res: express.Response,
  routerOptions: FlightctlRouterOptions,
  request: (options: FlightctlRequestOptions) => Promise<FlightctlApiResult>,
): Promise<void> {
  try {
    const requestOptions = await resolveFlightctlRequestOptions(
      req,
      routerOptions,
    );
    const result = await request(requestOptions);
    res.status(result.status).json(result.body);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to call the Flightctl API.';
    const status =
      error instanceof FlightctlRouteError
        ? error.status
        : error instanceof AuthenticationError
        ? 401
        : 502;
    res.status(status).json({ error: message });
  }
}

export function createFlightctlFleetsRouter(
  options: FlightctlRouterOptions,
): express.Router {
  const router = express.Router();

  router.get('/fleets', async (req, res) => {
    await proxyFlightctlRequest(req, res, options, fetchFleets);
  });

  router.get('/catalogitems', async (req, res) => {
    const fleetNames = readFleetNames(req);
    if (!fleetNames) {
      res.status(400).json({
        error:
          'Provide between 1 and 100 valid fleet query parameters for a catalog item request.',
      });
      return;
    }

    await proxyFlightctlRequest(req, res, options, requestOptions =>
      fetchCatalogItems(requestOptions, fleetNames),
    );
  });

  return router;
}
