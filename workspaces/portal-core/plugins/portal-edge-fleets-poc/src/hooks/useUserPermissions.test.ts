import {
  isPermissionAllowed,
  type PermissionCheck,
} from './useUserPermissions';

const check = (kind: string, verb: string): PermissionCheck => ({ kind, verb });

describe('isPermissionAllowed', () => {
  it('allows an exact resource and verb', () => {
    expect(
      isPermissionAllowed(
        [{ resource: 'fleets', operations: ['list', 'patch'] }],
        check('fleets', 'list'),
      ),
    ).toBe(true);
  });

  it('allows wildcard resource and verb', () => {
    expect(
      isPermissionAllowed(
        [{ resource: '*', operations: ['*'] }],
        check('fleets', 'patch'),
      ),
    ).toBe(true);
  });

  it('denies a resource with an empty operations list', () => {
    expect(
      isPermissionAllowed(
        [
          { resource: '*', operations: ['*'] },
          { resource: 'fleets', operations: [] },
        ],
        check('fleets', 'list'),
      ),
    ).toBe(false);
  });

  it('denies a missing resource and verb', () => {
    expect(
      isPermissionAllowed(
        [{ resource: 'devices', operations: ['list'] }],
        check('fleets', 'patch'),
      ),
    ).toBe(false);
    expect(
      isPermissionAllowed(
        [{ resource: 'fleets', operations: ['list'] }],
        check('fleets', 'patch'),
      ),
    ).toBe(false);
  });
});
