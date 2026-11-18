import { configApiRef, useApi } from '@backstage/core-plugin-api';
import type { ReactNode } from 'react';

import { isEdgeFleetsEnabled } from './edgeFleetsEnabled';

/** Hides the PoC pages without uninstalling the plugin. */
export function ConfigGate({ children }: { children?: ReactNode }) {
  return isEdgeFleetsEnabled(useApi(configApiRef)) ? <>{children}</> : null;
}
