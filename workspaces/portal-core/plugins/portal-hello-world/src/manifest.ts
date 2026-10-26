import type { PluginManifest } from '@ansible/portal-extension-common';
import {
  CONTENT_TYPES,
  EXPERIENCE_IDS,
} from '@ansible/portal-extension-common';

export const helloWorldManifest: PluginManifest = {
  id: 'hello-world',
  version: '0.1.0',
  apiVersion: '0.1.0',
  entitlements: [],
  capabilities: [
    {
      id: 'hello-world.greeting',
      ownerPlugin: 'hello-world',
      experienceId: EXPERIENCE_IDS.CONTENT_QUALITY,
      displayName: 'Hello World',
      description: 'A simple greeting on playbook repository pages.',
      appliesToContentTypes: [CONTENT_TYPES.PLAYBOOK_REPOSITORY],
      minimumHostApiVersion: '0.1.0',
      entryPoints: [
        {
          id: 'hello-world.greeting.tab',
          kind: 'entity-tab',
          surface: 'entity-page',
          label: 'Hello World',
          appliesToContentTypes: [CONTENT_TYPES.PLAYBOOK_REPOSITORY],
          launches: { type: 'slot', targetSlot: 'entity.detail.tabs' },
        },
      ],
    },
  ],
};
