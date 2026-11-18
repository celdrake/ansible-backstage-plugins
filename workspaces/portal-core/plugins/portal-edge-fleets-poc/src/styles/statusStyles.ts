import type { CSSProperties } from 'react';

export type StatusLevel = 'danger' | 'warning' | 'success' | 'info';

/**
 * Semantic foreground and background colors for status indicators.
 * Apply a tone to any component with a `style` prop, e.g.
 * `<Badge style={statusStyles.danger}>Needs attention</Badge>`.
 */
export const statusBgStyles: Record<StatusLevel, CSSProperties> = {
  danger: {
    backgroundColor: 'var(--bui-bg-danger)',
  },
  info: {
    backgroundColor: 'var(--bui-bg-info)',
  },
  warning: {
    backgroundColor: 'var(--bui-bg-warning)',
  },
  success: {
    backgroundColor: 'var(--bui-bg-success)',
  },
};

export const statusColorStyles: Record<StatusLevel, CSSProperties> = {
  danger: {
    color: 'var(--bui-fg-danger-on-bg)',
  },
  info: {
    color: 'var(--bui-fg-info-on-bg)',
  },
  warning: {
    color: 'var(--bui-fg-warning-on-bg)',
  },
  success: {
    color: 'var(--bui-fg-success-on-bg)',
  },
};
