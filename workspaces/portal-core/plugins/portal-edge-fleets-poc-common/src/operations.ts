import type { OperationDescriptor } from '@ansible/portal-extension-common';
import { createPermission } from '@backstage/plugin-permission-common';

/** Portal permission gating every fleet mutation. */
export const fleetUpdatePermission = createPermission({
  name: 'edge-fleets-poc.fleet.update',
  attributes: { action: 'update' },
});

const fleetPatchSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['op', 'path'],
    properties: {
      op: { enum: ['add', 'remove', 'replace'] },
      path: { type: 'string', pattern: '^/spec(/.*)?$' },
      value: {},
    },
    // add and replace carry a value; remove does not.
    if: { properties: { op: { enum: ['add', 'replace'] } } },
    then: { required: ['value'], properties: { value: {} } },
  },
} as const;

export const fleetUpdateOperation = {
  id: 'edge-fleets-poc.fleet.update',
  version: '1.0.0',
  description: 'Apply JSON Patch operations within a fleet spec.',
  organizationScope: 'organization',
  permission: fleetUpdatePermission,
  exposure: { rest: true },
  inputSchema: fleetPatchSchema,
  auditCategory: 'fleet-update',
  // add and remove change array contents, so replaying a request is not a no-op.
  idempotent: false,
} satisfies OperationDescriptor;
