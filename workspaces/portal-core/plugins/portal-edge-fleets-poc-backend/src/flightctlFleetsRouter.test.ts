import { pickFlightctlOrganizationId } from './flightctlFleetsRouter';

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
