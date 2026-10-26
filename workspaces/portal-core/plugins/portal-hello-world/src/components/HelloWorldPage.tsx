import { useEffect, useState } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';

type WhoAmIResponse = {
  authenticated: boolean;
  userEntityRef: string;
  ownershipEntityRefs: string[];
};

type WhoAmIState =
  | { status: 'loading' }
  | { status: 'loaded'; identity: WhoAmIResponse }
  | { status: 'error'; message: string };

export function HelloWorldPage() {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);
  const [state, setState] = useState<WhoAmIState>({ status: 'loading' });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadIdentity() {
      try {
        const { token } = await identityApi.getCredentials();
        if (!token) {
          throw new Error('No sign-in token is available. Sign in and retry.');
        }

        const baseUrl = await discoveryApi.getBaseUrl('hello-world');
        const response = await fetchApi.fetch(`${baseUrl}/whoami`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const responseBody = await response.text();
          throw new Error(
            responseBody || `Identity request failed (${response.status}).`,
          );
        }

        const identity = (await response.json()) as WhoAmIResponse;
        if (active) setState({ status: 'loaded', identity });
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    void loadIdentity();
    return () => {
      active = false;
    };
  }, [discoveryApi, fetchApi, identityApi, retry]);

  return (
    <main style={{ padding: 24 }}>
      <h1>Hello, world!</h1>
      <p>This page is served by the native Hello World Portal plugin.</p>
      <section aria-labelledby="identity-heading">
        <h2 id="identity-heading">Authenticated identity</h2>
        {state.status === 'loading' && <p role="status">Checking identity…</p>}
        {state.status === 'error' && (
          <>
            <p role="alert">{state.message}</p>
            <button
              type="button"
              onClick={() => {
                setState({ status: 'loading' });
                setRetry(current => current + 1);
              }}
            >
              Try again
            </button>
          </>
        )}
        {state.status === 'loaded' && (
          <>
            <p>The Hello World backend authenticated this request.</p>
            <dl>
              <dt>Authentication status</dt>
              <dd>
                {state.identity.authenticated ? 'Authenticated' : 'Unknown'}
              </dd>
              <dt>User entity reference</dt>
              <dd>{state.identity.userEntityRef}</dd>
              <dt>Ownership entity references</dt>
              <dd>
                <ul>
                  {state.identity.ownershipEntityRefs.map(entityRef => (
                    <li key={entityRef}>{entityRef}</li>
                  ))}
                </ul>
              </dd>
            </dl>
          </>
        )}
      </section>
    </main>
  );
}
