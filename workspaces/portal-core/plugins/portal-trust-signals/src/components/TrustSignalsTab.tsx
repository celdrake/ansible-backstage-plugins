import { useEffect, useState } from 'react';
import type { Entity } from '@backstage/catalog-model';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { SkeletonLoader, usePortalContext } from '@ansible/portal-plugin-sdk';

type TrustSignal = {
  id: string;
  label: string;
  status: 'PASS' | 'NOT_CONFIGURED';
  summary: string;
};

type TrustSignalsResponse = {
  demo: true;
  repositoryId: string;
  organizationId: string;
  signals: TrustSignal[];
};

type TrustSignalsState =
  | { status: 'loading' }
  | { status: 'loaded'; result: TrustSignalsResponse }
  | { status: 'error'; message: string };

export function TrustSignalsTab({ entity }: { entity?: Entity }) {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const {
    organizationIds,
    userEntityRef,
    loading: contextLoading,
    error: contextError,
  } = usePortalContext();
  const [state, setState] = useState<TrustSignalsState>({
    status: 'loading',
  });
  const repositoryId = entity?.metadata.name ?? '';
  const organizationId = organizationIds.length === 1 ? organizationIds[0] : '';

  useEffect(() => {
    if (contextLoading || contextError || !organizationId || !repositoryId) {
      return undefined;
    }

    let active = true;
    setState({ status: 'loading' });

    async function loadTrustSignals() {
      try {
        const baseUrl = await discoveryApi.getBaseUrl('trust-signals');
        const response = await fetchApi.fetch(
          `${baseUrl}/trust-signals/${encodeURIComponent(repositoryId)}`,
        );
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(
            detail || `Trust Signals request failed (${response.status}).`,
          );
        }
        const result = (await response.json()) as TrustSignalsResponse;
        if (active) setState({ status: 'loaded', result });
      } catch (error) {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    void loadTrustSignals();
    return () => {
      active = false;
    };
  }, [
    contextError,
    contextLoading,
    discoveryApi,
    fetchApi,
    organizationId,
    repositoryId,
  ]);

  if (!entity) {
    return <p role="alert">The Git Repository entity is unavailable.</p>;
  }

  if (contextLoading) return <SkeletonLoader />;

  return (
    <section style={{ padding: 16 }}>
      <h3 style={{ color: 'var(--portal-color-primary)' }}>
        Trust Signals for {repositoryId}
      </h3>
      {userEntityRef && <p>Signed-in user: {userEntityRef}</p>}
      <p style={{ color: 'var(--portal-color-text-secondary)' }}>
        Organizations: {organizationIds.join(', ') || 'Unavailable'}
      </p>
      {contextError && (
        <p role="alert">
          Organization context is unavailable: {contextError.message}
        </p>
      )}
      {!contextError && organizationIds.length !== 1 && (
        <p role="alert">
          The Trust Signals example requires exactly one trusted organization.
        </p>
      )}
      {!contextError && organizationId && state.status === 'loading' && (
        <p role="status">Loading trust signals…</p>
      )}
      {!contextError && organizationId && state.status === 'error' && (
        <p role="alert">{state.message}</p>
      )}
      {!contextError && organizationId && state.status === 'loaded' && (
        <>
          {state.result.demo && <p>This response uses quickstart demo data.</p>}
          <ul>
            {state.result.signals.map(signal => (
              <li key={signal.id}>
                <strong>
                  {signal.label}: {signal.status}
                </strong>{' '}
                — {signal.summary}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
