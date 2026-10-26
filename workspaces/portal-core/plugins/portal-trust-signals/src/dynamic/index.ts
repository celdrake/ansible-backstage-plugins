import {
  registerGitRepoDetailTab,
  registerManifest,
} from '@ansible/portal-extension-api';
import { TrustSignalsTab } from '../components/TrustSignalsTab';
import { trustSignalsManifest } from '../manifest';

export function registerTrustSignalsContribution(): void {
  registerManifest(trustSignalsManifest);
  registerGitRepoDetailTab({
    id: 'trust-signals.trust-signals',
    label: 'Trust Signals',
    component: TrustSignalsTab,
    appliesToContentTypes: ['playbook-repository'],
    priority: 30,
  });
}
