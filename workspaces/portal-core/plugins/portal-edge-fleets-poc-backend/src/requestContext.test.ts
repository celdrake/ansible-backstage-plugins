import { AuthenticationError, NotAllowedError } from '@backstage/errors';
import { readAapToken, requirePortalContext } from './requestContext';

describe('backend request context', () => {
  it('requires an AAP access token', () => {
    expect(() => readAapToken({ header: () => undefined })).toThrow(
      AuthenticationError,
    );
    expect(readAapToken({ header: () => ' token ' })).toBe('token');
  });

  it('requires an authenticated Portal context', () => {
    expect(() => requirePortalContext({})).toThrow(AuthenticationError);
  });

  it('requires one unambiguous Portal organization', () => {
    expect(() =>
      requirePortalContext({
        portalContext: {
          userEntityRef: 'user:default/alice',
          userId: 'alice',
          organizationIds: ['engineering', 'finance'],
        },
      }),
    ).toThrow(NotAllowedError);
  });

  it('returns the trusted organization', () => {
    expect(
      requirePortalContext({
        portalContext: {
          userEntityRef: 'user:default/alice',
          userId: 'alice',
          organizationId: 'engineering',
        },
      }).organizationId,
    ).toBe('engineering');
  });
});
