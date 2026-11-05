import type { HttpAuthService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { AuthenticationError } from '@backstage/errors';
import type { IAAPService } from '@ansible/backstage-rhaap-common';
import type { PatchRequest } from '@ansible/portal-edge-fleets-poc-common';
import type { CatalogItemList } from '@ansible/portal-edge-fleets-poc-common/alpha';
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

type FlightctlApiCallOptions = {
  method?: 'GET' | 'PATCH';
  body?: string;
  contentType?: string;
};

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
const FLEET_OS_SPEC_PATH = '/spec/template/spec/os';

async function flightctlApiCall(
  url: URL,
  options: FlightctlRequestOptions,
  requestOptions: FlightctlApiCallOptions = {},
): Promise<FlightctlApiResult> {
  if (url.protocol !== 'https:') {
    throw new Error('The Flightctl API URL must use HTTPS.');
  }

  const { method = 'GET', body, contentType } = requestOptions;

  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${options.accessToken}`,
          ...(contentType ? { 'Content-Type': contentType } : {}),
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
    request.end(body);
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

// Retrieves the device summary without fetching the device list.
async function fetchDeviceSummary(
  options: FlightctlRequestOptions,
): Promise<FlightctlApiResult> {
  const url = new URL('/api/v1/devices', options.apiBaseUrl);
  url.searchParams.set('org_id', options.organizationId);
  url.searchParams.set('summaryOnly', 'true');

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

async function patchFleetOs(
  options: FlightctlRequestOptions,
  fleetName: string,
  patches: PatchRequest,
): Promise<FlightctlApiResult> {
  const url = new URL(
    `/api/v1/fleets/${encodeURIComponent(fleetName)}`,
    options.apiBaseUrl,
  );
  url.searchParams.set('org_id', options.organizationId);

  return flightctlApiCall(url, options, {
    method: 'PATCH',
    contentType: 'application/json-patch+json',
    body: JSON.stringify(patches),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidString(
  value: unknown,
  acceptEmpty: boolean = false,
): value is string {
  return typeof value === 'string' && (acceptEmpty || value.length > 0);
}

function isFleetPatch(value: unknown): value is PatchRequest {
  if (!Array.isArray(value) || value.length !== 1) return false;

  const [operation] = value;
  if (
    !isRecord(operation) ||
    operation.op !== 'replace' ||
    !isValidString(operation.path)
  ) {
    return false;
  }

  return true;
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
    'ansible.edge-fleets-poc.flightctl.apiBaseUrl',
  );
  const configuredOrganizationId = options.config
    .getOptionalString('ansible.edge-fleets-poc.flightctl.organizationId')
    ?.trim();
  if (!apiBaseUrl || !configuredOrganizationId) {
    throw new FlightctlRouteError(
      500,
      'Configure ansible.edge-fleets-poc.flightctl.apiBaseUrl and organizationId.',
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
        'ansible.edge-fleets-poc.flightctl.skipTlsVerify',
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

  router.get('/devices', async (req, res) => {
    await proxyFlightctlRequest(req, res, options, fetchDeviceSummary);
  });

  router.patch(
    '/fleets/:fleetName',
    express.json({
      limit: '64kb',
      type: ['application/json', 'application/json-patch+json'],
    }),
    async (req, res) => {
      const fleetName = req.params.fleetName;
      if (!FLEET_NAME_PATTERN.test(fleetName)) {
        res.status(400).json({ error: 'Provide a valid fleet name.' });
        return;
      }
      if (!isFleetPatch(req.body)) {
        res.status(400).json({
          error:
            'Expected one replace operation for the fleet operating system catalog reference.',
        });
        return;
      }

      await proxyFlightctlRequest(req, res, options, requestOptions =>
        patchFleetOs(requestOptions, fleetName, req.body),
      );
    },
  );

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
