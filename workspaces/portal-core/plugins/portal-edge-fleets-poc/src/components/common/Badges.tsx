import { RiArrowUpCircleLine } from '@remixicon/react';

import styles from './Badges.module.css';

export const StatusBadge = ({ text }: { text: string }) => {
  return (
    <span className={styles.statusBadge}>
      <span className={styles.statusBadgeDot} aria-hidden />
      {text}
    </span>
  );
};

export const ViewOnlyBadge = () => {
  return <span className={styles.viewOnlyBadge}>View only</span>;
};

export const UpdateAvailableBadge = () => {
  return (
    <span className={styles.updateAvailableBadge}>
      <RiArrowUpCircleLine className={styles.updateAvailableIcon} aria-hidden />
      Update available
    </span>
  );
};
