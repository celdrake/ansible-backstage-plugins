import * as React from 'react';
import { Alert } from '@backstage/ui';
import type {
  Permission,
  PermissionList,
} from '@ansible/portal-edge-fleets-poc-common';
import useFlightCtlApiFetch from './useFlightCtlApiFetch';

export type PermissionCheck = { kind: string; verb: string };

const isVerbAllowed = (operations: string[], verb: string) =>
  operations.includes('*') || operations.includes(verb);

export const isPermissionAllowed = (
  userPermissions: Permission[],
  check: PermissionCheck,
): boolean => {
  const resourcePermissions = userPermissions.filter(
    permission => permission.resource === check.kind,
  );

  // An empty operations list denies the resource even when a wildcard is granted.
  if (
    resourcePermissions.some(permission => permission.operations.length === 0)
  ) {
    return false;
  }
  if (
    resourcePermissions.some(permission =>
      isVerbAllowed(permission.operations, check.verb),
    )
  ) {
    return true;
  }
  return userPermissions
    .filter(permission => permission.resource === '*')
    .some(permission => isVerbAllowed(permission.operations, check.verb));
};

type UserPermissionsContextValue = {
  loading: boolean;
  error: string | undefined;
  checkPermissions: (checks: PermissionCheck[]) => boolean[];
};

const UserPermissionsContext = React.createContext<
  UserPermissionsContextValue | undefined
>(undefined);

export const UserPermissionsProvider = ({
  children,
}: React.PropsWithChildren) => {
  const flightCtlFetch = useFlightCtlApiFetch();
  const [userPermissions, setUserPermissions] = React.useState<Permission[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const controller = new AbortController();

    const loadPermissions = async () => {
      try {
        const response = await flightCtlFetch<PermissionList>(
          '/permissions',
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setUserPermissions(response.permissions ?? []);
        }
      } catch (err) {
        // Aborts are expected when the provider unmounts.
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load permissions.',
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadPermissions();
    return () => controller.abort();
  }, [flightCtlFetch]);

  const checkPermissions = React.useCallback(
    (checks: PermissionCheck[]) =>
      checks.map(check => isPermissionAllowed(userPermissions, check)),
    [userPermissions],
  );

  const value = React.useMemo(
    () => ({ loading, error, checkPermissions }),
    [loading, error, checkPermissions],
  );

  return (
    <UserPermissionsContext.Provider value={value}>
      {children}
    </UserPermissionsContext.Provider>
  );
};

export const useUserPermissions = (): UserPermissionsContextValue => {
  const context = React.useContext(UserPermissionsContext);
  if (!context) {
    throw new Error(
      'useUserPermissions must be used within a UserPermissionsProvider',
    );
  }
  return context;
};

export const AccessDenied = () => {
  return (
    <Alert
      status="danger"
      title="Restricted access"
      description="You don't have access to this section."
    />
  );
};
