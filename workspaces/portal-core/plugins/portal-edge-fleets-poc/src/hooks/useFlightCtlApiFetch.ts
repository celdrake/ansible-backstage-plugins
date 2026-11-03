import { useCallback } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { rhAapAuthApiRef } from '@ansible/aap-app-auth';

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

const useFlightCtlApiFetch = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);
  const aapAuthApi = useApi(rhAapAuthApiRef);

  return useCallback(
    async <T>(
      path: string,
      signal?: AbortSignal,
      requestInit: Omit<RequestInit, 'signal'> = {},
    ): Promise<T> => {
      const { token: backstageToken } = await identityApi.getCredentials();
      if (!backstageToken) {
        throw new Error(`Sign in to Backstage before loading data.`);
      }

      const aapAccessToken = await aapAuthApi.getAccessToken();
      if (!aapAccessToken) {
        throw new Error(`Sign in with the RH AAP provider to load data.`);
      }

      const baseUrl = await discoveryApi.getBaseUrl('edge-fleets-poc');
      const headers = new Headers(requestInit.headers);
      headers.set('Authorization', `Bearer ${backstageToken}`);
      headers.set('X-RHAAP-Access-Token', aapAccessToken);
      const response = await fetchApi.fetch(`${baseUrl}${path}`, {
        ...requestInit,
        headers,
        signal,
      });
      if (!response.ok) throw new Error(await readError(response));

      const responseBody = await response.text();
      return (responseBody ? JSON.parse(responseBody) : undefined) as T;
    },
    [aapAuthApi, discoveryApi, fetchApi, identityApi],
  );
};

export default useFlightCtlApiFetch;
