import React from 'react';
import { ButtonLink, Text } from '@backstage/ui';
import { RiExternalLinkLine } from '@remixicon/react';
import { getRhemHomeUrl } from '../../utils/routes';

import styles from './DefaultEmptyState.module.css';

const DefaultEmptyState = ({
  icon,
  title,
  description,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
}) => {
  return (
    <div className={styles.defaultEmptyState}>
      <div className={styles.defaultEmptyStateIcon} aria-hidden>
        {icon}
      </div>
      <Text weight="bold" className={styles.defaultEmptyStateTitle}>
        {title}
      </Text>
      <Text
        variant="body-small"
        color="secondary"
        className={styles.defaultEmptyStateBody}
      >
        {description}
      </Text>
      {actionLabel ? (
        <ButtonLink
          variant="secondary"
          href={getRhemHomeUrl()}
          target="_blank"
          rel="noopener noreferrer"
          iconEnd={<RiExternalLinkLine aria-hidden />}
        >
          {actionLabel}
        </ButtonLink>
      ) : null}
    </div>
  );
};

export default DefaultEmptyState;
