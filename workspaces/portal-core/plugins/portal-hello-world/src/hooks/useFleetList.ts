import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { rhAapAuthApiRef } from '@ansible/aap-app-auth';
import type { Fleet, FleetList } from '@ansible/portal-hello-world-common';
import { useEffect, useState } from 'react';

export type SuccessFleetListState = {
  status: 'loaded';
  fleets: Fleet[];
  totalOfflineDevices: number;
};

export type FleetListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | SuccessFleetListState;

const getTotalOfflineDevices = (fleets: Fleet[]) => {
  return fleets.reduce((acc, fleet) => {
    return acc + (fleet.status?.devicesSummary?.total ?? 0);
  }, 0);
};

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

const useFleetList = () => {
  // CELIA-WIP: SIMPLIFY LOADING HOOKS
  // CELIA-WIP: USEFETCHPERIODICALLY
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);
  const aapAuthApi = useApi(rhAapAuthApiRef);
  const [state, setState] = useState<FleetListState>({ status: 'loading' });

  useEffect(() => {
    let active = true;

    async function loadFleets() {
      try {
        setState({ status: 'loading' });
        const { token: backstageToken } = await identityApi.getCredentials();
        if (!backstageToken) {
          throw new Error('Sign in to Backstage before loading fleets.');
        }

        const aapAccessToken = await aapAuthApi.getAccessToken();
        if (!aapAccessToken) {
          throw new Error('Sign in with the RH AAP provider to load fleets.');
        }

        const baseUrl = await discoveryApi.getBaseUrl('hello-world');
        const response = await fetchApi.fetch(`${baseUrl}/fleets`, {
          headers: {
            Authorization: `Bearer ${backstageToken}`,
            'X-RHAAP-Access-Token': aapAccessToken,
          },
        });
        if (!response.ok) throw new Error(await readError(response));

        const fleetList = (await response.json()) as FleetList;
        if (!fleetList || !Array.isArray(fleetList.items)) {
          throw new Error(
            'The backend returned an invalid Flightctl fleet list.',
          );
        }

        if (active) {
          setState({
            status: 'loaded',
            fleets: fleetList.items,
            totalOfflineDevices: getTotalOfflineDevices(fleetList.items),
          });
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

    void loadFleets();
    return () => {
      active = false;
    };
  }, [aapAuthApi, discoveryApi, fetchApi, identityApi]);

  return state;
};

export default useFleetList;
