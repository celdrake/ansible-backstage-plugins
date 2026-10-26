import {
  PageBlueprint,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { compatWrapper } from '@backstage/core-compat-api';
import ExtensionIcon from '@material-ui/icons/Extension';
import { EntityDetailTabBlueprint } from '@ansible/portal-extension-api/alpha';
import { helloWorldManifest } from './manifest';

export default createFrontendPlugin({
  pluginId: 'hello-world',
  extensions: [
    PageBlueprint.make({
      name: 'hello-world',
      params: {
        path: '/hello-world',
        title: 'Hello World',
        icon: <ExtensionIcon />,
        noHeader: true,
        loader: async () => {
          const { HelloWorldPage } = await import(
            './components/HelloWorldPage'
          );
          return compatWrapper(<HelloWorldPage />);
        },
      },
    }),
    EntityDetailTabBlueprint.make({
      name: 'greeting',
      params: {
        manifest: helloWorldManifest,
        capabilityId: 'hello-world.greeting',
        entryPointId: 'hello-world.greeting.tab',
        attachment: 'entity.detail.tabs',
        enabledByConfig: 'ansible.hello-world.enabled',
        loader: async () => {
          const { HelloWorldPage } = await import(
            './components/HelloWorldPage'
          );
          return <HelloWorldPage />;
        },
      },
    }),
  ],
});
