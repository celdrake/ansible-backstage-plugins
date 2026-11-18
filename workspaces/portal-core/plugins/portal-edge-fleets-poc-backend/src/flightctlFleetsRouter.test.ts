import type { BackstageCredentials } from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { fleetUpdatePermission } from '@ansible/portal-edge-fleets-poc-common/operations';
import {
  cachedOrganizationId,
  isFleetPatch,
  pickFlightctlOrganizationId,
  requirePermission,
} from './flightctlFleetsRouter';

const organization = (name: string, externalId?: string) => ({
  apiVersion: 'v1beta1',
  kind: 'Organization',
  metadata: { name },
  spec: externalId === undefined ? undefined : { externalId },
});

describe('Flightctl organization mapping', () => {
  it('matches the Portal organization against the Flightctl externalId', () => {
    expect(
      pickFlightctlOrganizationId(
        [organization('uuid-1', ' Other '), organization('uuid-2', 'Default')],
        ' default ',
      ),
    ).toBe('uuid-2');
  });

  it.each([
    ['no matching organization', [organization('uuid-1', 'Other')]],
    [
      'an ambiguous match',
      [organization('uuid-1', 'Default'), organization('uuid-2', 'default')],
    ],
    ['an organization without externalId', [organization('uuid-1')]],
    ['an invalid payload', [{ metadata: {}, spec: {} }]],
    ['a non-list payload', undefined],
  ])('returns undefined for %s', (_label, items) => {
    expect(pickFlightctlOrganizationId(items, 'default')).toBeUndefined();
  });
});

describe('Flightctl organization cache', () => {
  it('resolves once per key and evicts failed resolutions', async () => {
    const cache = new Map<string, Promise<string>>();
    const resolve = jest.fn().mockResolvedValue('uuid-1');

    await Promise.all([
      cachedOrganizationId(cache, 'user-a', resolve),
      cachedOrganizationId(cache, 'user-a', resolve),
    ]);
    expect(resolve).toHaveBeenCalledTimes(1);

    const failing = jest.fn().mockRejectedValue(new Error('unavailable'));
    await expect(
      cachedOrganizationId(cache, 'user-b', failing),
    ).rejects.toThrow('unavailable');
    expect(cache.has('user-b')).toBe(false);
  });
});

describe('fleet update permission', () => {
  const credentials = {} as BackstageCredentials;
  const service = (result: AuthorizeResult) =>
    ({ authorize: jest.fn().mockResolvedValue([{ result }]) }) as any;

  it('accepts an explicit allow', async () => {
    await expect(
      requirePermission(service(AuthorizeResult.ALLOW), credentials, fleetUpdatePermission),
    ).resolves.toBeUndefined();
  });

  it('rejects a deny', async () => {
    await expect(
      requirePermission(service(AuthorizeResult.DENY), credentials, fleetUpdatePermission),
    ).rejects.toThrow('Permission denied: edge-fleets-poc.fleet.update');
  });
});

describe('fleet patch route boundary', () => {
  it.each([
    '/spec/template/spec/os',
    '/spec/template/spec/os/image',
  ])('accepts a replace within the OS spec: %s', path => {
    expect(isFleetPatch([{ op: 'replace', path, value: 'x' }])).toBe(true);
  });

  it.each([
    ['the spec root', '/spec'],
    ['another spec section', '/spec/template/spec/applications'],
    ['a path outside the spec', '/metadata/name'],
    ['a non-replace operation', { op: 'remove', path: '/spec/template/spec/os' }],
    ['more than one operation', [
      { op: 'replace', path: '/spec/template/spec/os', value: {} },
      { op: 'replace', path: '/spec/template/spec/os', value: {} },
    ]],
  ])('rejects %s', (_label, body) => {
    expect(isFleetPatch(body)).toBe(false);
  });
});
