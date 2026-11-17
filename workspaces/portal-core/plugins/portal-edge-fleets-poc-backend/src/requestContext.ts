import type { PortalContext } from '@ansible/portal-plugin-node';
import { AuthenticationError, NotAllowedError } from '@backstage/errors';

export function readAapToken(req: {
  header(name: string): string | undefined;
}): string {
  const value = req.header('x-rhaap-access-token')?.trim();
  if (!value) {
    throw new AuthenticationError(
      'AAP sign-in is required to call the Flightctl API.',
    );
  }
  return value;
}

export function requirePortalContext(req: {
  portalContext?: PortalContext;
}): PortalContext & { organizationId: string } {
  const context = req.portalContext;
  if (!context) {
    throw new AuthenticationError(
      'Sign in to Portal before using Edge Fleets.',
    );
  }
  if (!context.organizationId) {
    throw new NotAllowedError(
      'A single validated Portal organization is required.',
    );
  }
  return { ...context, organizationId: context.organizationId };
}
