import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { EntityDetailTabBlueprint } from '@ansible/portal-extension-api/alpha';
import { trustSignalsManifest } from './manifest';
import { registerTrustSignalsContribution } from './dynamic';

// The quickstart uses the legacy contribution registry, so register its
// manifest and Git Repository tab when this optional feature is loaded.
registerTrustSignalsContribution();

export default createFrontendPlugin({
  pluginId: 'trust-signals',
  extensions: [
    EntityDetailTabBlueprint.make({
      name: 'trust-signals',
      params: {
        manifest: trustSignalsManifest,
        capabilityId: 'trust-signals.trust-signals',
        entryPointId: 'trust-signals.trust-signals.tab',
        attachment: 'entity.detail.tabs',
        loader: async ({ entity }) => {
          const { TrustSignalsTab } = await import(
            './components/TrustSignalsTab'
          );
          return <TrustSignalsTab entity={entity} />;
        },
      },
    }),
  ],
});
