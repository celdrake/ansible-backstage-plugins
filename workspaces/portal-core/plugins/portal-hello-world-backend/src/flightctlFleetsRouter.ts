import type {
  HttpAuthService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { AuthenticationError } from '@backstage/errors';
import type { IAAPService } from '@ansible/backstage-rhaap-common';
import * as https from 'node:https';
import express from 'express';
import { readUserOrganizations } from './aapApiExampleRouter';

async function readFlightctlFleets(options: {
  apiBaseUrl: string;
  organizationId: string;
  accessToken: string;
  skipTlsVerify: boolean;
}): Promise<{ status: number; body: unknown }> {
  const url = new URL('/api/v1/fleets', options.apiBaseUrl);
  url.searchParams.set('org_id', options.organizationId);
  url.searchParams.set('addDevicesSummary', 'true');

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

export function createFlightctlFleetsRouter(options: {
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  ansibleService: IAAPService;
  config: Config;
}): express.Router {
  const router = express.Router();

  router.get('/fleets', async (req, res) => {
    const apiBaseUrl = options.config.getOptionalString(
      'ansible.hello-world.flightctl.apiBaseUrl',
    );
    const organizationId = options.config
      .getOptionalString('ansible.hello-world.flightctl.organizationId')
      ?.trim();
    if (!apiBaseUrl || !organizationId) {
      res.status(500).json({
        error:
          'Configure ansible.hello-world.flightctl.apiBaseUrl and organizationId.',
      });
      return;
    }

    try {
      const { accessToken } = await readUserOrganizations({
        ...options,
        req,
      });
      const result = await readFlightctlFleets({
        apiBaseUrl,
        organizationId,
        accessToken,
        skipTlsVerify:
          options.config.getOptionalBoolean(
            'ansible.hello-world.flightctl.skipTlsVerify',
          ) ?? false,
      });
      res.status(result.status).json(result.body);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to call the Flightctl API.';
      const status = error instanceof AuthenticationError ? 401 : 502;
      res.status(status).json({ error: message });
    }
  });

  return router;
}
