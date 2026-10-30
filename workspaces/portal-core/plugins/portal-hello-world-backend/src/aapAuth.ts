import type { HttpAuthService } from '@backstage/backend-plugin-api';
import { AuthenticationError } from '@backstage/errors';
import type { IAAPService } from '@ansible/backstage-rhaap-common';
import express from 'express';

type AapOrganization = {
  externalOrgId: string;
  name: string;
};

function readAapToken(req: express.Request): string | undefined {
  const value = req.header('x-rhaap-access-token')?.trim();
  return value || undefined;
}

export async function readUserOrganizations(options: {
  req: express.Request;
  httpAuth: HttpAuthService;
  ansibleService: IAAPService;
}): Promise<{ accessToken: string; organizations: AapOrganization[] }> {
  const accessToken = readAapToken(options.req);
  if (!accessToken) {
    throw new AuthenticationError(
      'AAP sign-in is required to read AAP organizations.',
    );
  }

  await options.httpAuth.credentials(
    options.req as unknown as Parameters<HttpAuthService['credentials']>[0],
    { allow: ['user'] },
  );
  const profile = await options.ansibleService.fetchProfile(accessToken);
  const aapUserId = Number(profile.id);

  if (!profile.username || !Number.isSafeInteger(aapUserId) || aapUserId < 1) {
    throw new AuthenticationError('AAP returned an invalid user profile.');
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
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
  return { accessToken, organizations };
}
