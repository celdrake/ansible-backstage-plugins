import {
  PageBlueprint,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { compatWrapper } from '@backstage/core-compat-api';
import RouterIcon from '@material-ui/icons/Router';

export default createFrontendPlugin({
  pluginId: 'edge-fleets-poc',
  extensions: [
    PageBlueprint.make({
      name: 'edge-fleets-poc',
      params: {
        path: '/edge-fleets-poc',
        title: 'Edge Fleets',
        icon: <RouterIcon />,
        noHeader: true,
        loader: async () => {
          const { default: FleetsPage } = await import(
            './components/FleetsPage/FleetsPage'
          );
          return compatWrapper(<FleetsPage />);
        },
      },
    }),
  ],
});
