import {
  CONTENT_TYPES,
  EXPERIENCE_IDS,
  type PluginManifest,
} from '@ansible/portal-extension-api';

export const trustSignalsManifest: PluginManifest = {
  id: 'trust-signals',
  version: '0.1.0',
  apiVersion: '0.1.0',
  entitlements: [],
  capabilities: [
    {
      id: 'trust-signals.trust-signals',
      ownerPlugin: 'trust-signals',
      experienceId: EXPERIENCE_IDS.CONTENT_QUALITY,
      displayName: 'Trust Signals',
      description: 'Sample trust checks for an Ansible Git Repository.',
      appliesToContentTypes: [CONTENT_TYPES.PLAYBOOK_REPOSITORY],
      minimumHostApiVersion: '0.1.0',
      entryPoints: [
        {
          id: 'trust-signals.trust-signals.tab',
          kind: 'entity-tab',
          surface: 'entity-page',
          label: 'Trust Signals',
          appliesToContentTypes: [CONTENT_TYPES.PLAYBOOK_REPOSITORY],
          launches: { type: 'slot', targetSlot: 'entity.detail.tabs' },
        },
      ],
    },
  ],
};
