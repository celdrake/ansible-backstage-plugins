import { useEffect, useState } from 'react';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { rhAapAuthApiRef } from '@ansible/aap-app-auth';

type WhoAmIResponse = {
  authenticated: boolean;
  userEntityRef: string;
  ownershipEntityRefs: string[];
};

type WhoAmIState =
  | { status: 'loading' }
  | { status: 'loaded'; identity: WhoAmIResponse }
  | { status: 'error'; message: string };

type AapOrganization = {
  externalOrgId: string;
  name: string;
  internalOrgId?: string;
};

type AapOrganizationsState =
  | { status: 'loading' }
  | { status: 'loaded'; organizations: AapOrganization[] }
  | { status: 'error'; message: string };

type AapApiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; result: unknown }
  | { status: 'error'; message: string };

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) return `Request failed (${response.status}).`;
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // Keep a plain-text error response readable.
  }
  return body;
}

export function HelloWorldPage() {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const identityApi = useApi(identityApiRef);
  const aapAuthApi = useApi(rhAapAuthApiRef);
  const [state, setState] = useState<WhoAmIState>({ status: 'loading' });
  const [retry, setRetry] = useState(0);
  const [aapRetry, setAapRetry] = useState(0);
  const [aapOrganizations, setAapOrganizations] =
    useState<AapOrganizationsState>({ status: 'loading' });
  const [selectedExternalOrgId, setSelectedExternalOrgId] = useState('');
  const [aapApiState, setAapApiState] = useState<AapApiState>({
    status: 'idle',
  });

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

  useEffect(() => {
    let active = true;

    async function loadAapOrganizations() {
      try {
        setAapOrganizations({ status: 'loading' });
        const { token: backstageToken } = await identityApi.getCredentials();
        if (!backstageToken) {
          throw new Error('Sign in to Backstage before connecting to AAP.');
        }

        // This is an AAP OAuth access token, separate from the Backstage token.
        // Keep it in memory and never render or persist its value.
        const aapAccessToken = await aapAuthApi.getAccessToken();
        if (!aapAccessToken) {
          throw new Error('Sign in with the RH AAP provider to continue.');
        }

        const baseUrl = await discoveryApi.getBaseUrl('hello-world');
        const response = await fetchApi.fetch(`${baseUrl}/aap-organizations`, {
          headers: {
            Authorization: `Bearer ${backstageToken}`,
            'X-RHAAP-Access-Token': aapAccessToken,
          },
        });
        if (!response.ok) throw new Error(await readError(response));

        const body = (await response.json()) as {
          organizations?: AapOrganization[];
        };
        if (!Array.isArray(body.organizations)) {
          throw new Error(
            'The backend returned an invalid AAP organization list.',
          );
        }
        if (active) {
          const organizations = body.organizations;
          setAapOrganizations({ status: 'loaded', organizations });
          const mapped = organizations.filter(org => org.internalOrgId);
          setSelectedExternalOrgId(
            mapped.length === 1 ? mapped[0].externalOrgId : '',
          );
          setAapApiState({ status: 'idle' });
        }
      } catch (error) {
        if (active) {
          setAapOrganizations({
            status: 'error',
            message:
              error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    void loadAapOrganizations();
    return () => {
      active = false;
    };
  }, [aapAuthApi, aapRetry, discoveryApi, fetchApi, identityApi]);

  async function callApplicationApi() {
    if (!selectedExternalOrgId) return;
    setAapApiState({ status: 'loading' });
    try {
      const { token: backstageToken } = await identityApi.getCredentials();
      if (!backstageToken) {
        throw new Error('Sign in to Backstage before calling the API.');
      }
      const aapAccessToken = await aapAuthApi.getAccessToken();
      if (!aapAccessToken) {
        throw new Error('Sign in with the RH AAP provider to continue.');
      }
      const baseUrl = await discoveryApi.getBaseUrl('hello-world');
      const url = new URL(`${baseUrl}/aap-api-example`);
      url.searchParams.set('externalOrgId', selectedExternalOrgId);
      const response = await fetchApi.fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${backstageToken}`,
          'X-RHAAP-Access-Token': aapAccessToken,
        },
      });
      if (!response.ok) throw new Error(await readError(response));
      setAapApiState({ status: 'loaded', result: await response.json() });
    } catch (error) {
      setAapApiState({
        status: 'error',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

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
      <section aria-labelledby="aap-heading" style={{ marginTop: 32 }}>
        <h2 id="aap-heading">AAP token and organization mapping</h2>
        <p>
          This example reads an AAP access token after RH AAP sign-in, resolves
          the signed-in user’s external AAP organization IDs, maps one to an
          internal API organization ID, and calls the configured application
          API.
        </p>
        {aapOrganizations.status === 'loading' && (
          <p role="status">Connecting to AAP…</p>
        )}
        {aapOrganizations.status === 'error' && (
          <>
            <p role="alert">{aapOrganizations.message}</p>
            <button
              type="button"
              onClick={() => {
                setAapOrganizations({ status: 'loading' });
                setAapRetry(current => current + 1);
              }}
            >
              Retry AAP connection
            </button>
          </>
        )}
        {aapOrganizations.status === 'loaded' && (
          <>
            {aapOrganizations.organizations.length === 0 ? (
              <p role="status">
                No AAP organizations are available to this user.
              </p>
            ) : (
              <>
                <label htmlFor="aap-organization">
                  AAP organization (external ID)
                </label>{' '}
                <select
                  id="aap-organization"
                  value={selectedExternalOrgId}
                  onChange={event => {
                    setSelectedExternalOrgId(event.target.value);
                    setAapApiState({ status: 'idle' });
                  }}
                >
                  <option value="">Choose a mapped organization</option>
                  {aapOrganizations.organizations.map(org => (
                    <option
                      key={org.externalOrgId}
                      value={org.externalOrgId}
                      disabled={!org.internalOrgId}
                    >
                      {org.name} — AAP {org.externalOrgId}
                      {org.internalOrgId
                        ? ` → API ${org.internalOrgId}`
                        : ' — no API mapping'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={
                    !selectedExternalOrgId || aapApiState.status === 'loading'
                  }
                  onClick={() => void callApplicationApi()}
                  style={{ marginLeft: 8 }}
                >
                  {aapApiState.status === 'loading'
                    ? 'Calling API…'
                    : 'Call application API'}
                </button>
              </>
            )}
          </>
        )}
        {aapApiState.status === 'error' && (
          <p role="alert">{aapApiState.message}</p>
        )}
        {aapApiState.status === 'loaded' && (
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {JSON.stringify(aapApiState.result, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
