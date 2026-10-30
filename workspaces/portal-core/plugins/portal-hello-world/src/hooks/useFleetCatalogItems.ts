import { useEffect, useState } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { rhAapAuthApiRef } from '@ansible/aap-app-auth';
import type { CatalogItemList } from '@ansible/portal-hello-world-common/alpha';
import { FleetCatalogItemsState } from '../components/FleetsPage/types';

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) return `Request failed (${response.status}).`;
  try {
    const parsed = JSON.parse(body) as {
      error?: unknown;
      message?: unknown;
    };
    if (typeof parsed.error === 'string') return parsed.error;
    if (typeof parsed.message === 'string') return parsed.message;
  } catch {
    // Keep plain-text API errors readable.
  }
  return body;
}

const useFleetCatalogItems = (fleetNames: string[]) => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);
  const aapAuthApi = useApi(rhAapAuthApiRef);
  const fleetNamesKey = fleetNames.join('\u0000');
  const [state, setState] = useState<FleetCatalogItemsState>({
    status: 'loading',
  });

  useEffect(() => {
    let active = true;
    const fleetNames = fleetNamesKey ? fleetNamesKey.split('\u0000') : [];

    if (fleetNames.length === 0) {
      setState({ status: 'loaded', catalogItems: [] });
      return () => {
        active = false;
      };
    }

    async function loadCatalogItems() {
      try {
        setState({ status: 'loading' });
        const { token: backstageToken } = await identityApi.getCredentials();
        if (!backstageToken) {
          throw new Error(
            'Sign in to Backstage before loading OS catalog items.',
          );
        }

        const aapAccessToken = await aapAuthApi.getAccessToken();
        if (!aapAccessToken) {
          throw new Error(
            'Sign in with the RH AAP provider to load OS catalog items.',
          );
        }

        const baseUrl = await discoveryApi.getBaseUrl('hello-world');
        const query = new URLSearchParams();
        fleetNames.forEach(name => query.append('fleet', name));
        const response = await fetchApi.fetch(
          `${baseUrl}/catalogitems?${query.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${backstageToken}`,
              'X-RHAAP-Access-Token': aapAccessToken,
            },
          },
        );
        if (!response.ok) throw new Error(await readError(response));

        const catalogItemList = (await response.json()) as CatalogItemList;
        if (!catalogItemList || !Array.isArray(catalogItemList.items)) {
          throw new Error(
            'The backend returned an invalid Flightctl catalog item list.',
          );
        }
        if (active) {
          setState({ status: 'loaded', catalogItems: catalogItemList.items });
        }
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    void loadCatalogItems();
    return () => {
      active = false;
    };
  }, [aapAuthApi, discoveryApi, fetchApi, fleetNamesKey, identityApi]);

  return state;
};

export default useFleetCatalogItems;
