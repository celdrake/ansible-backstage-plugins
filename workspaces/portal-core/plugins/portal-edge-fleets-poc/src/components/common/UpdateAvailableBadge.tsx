import { RiArrowUpCircleLine } from '@remixicon/react';

import styles from './UpdateAvailableBadge.module.css';

const UpdateAvailableBadge = () => {
  return (
    <span className={styles.updateAvailableBadge}>
      <RiArrowUpCircleLine className={styles.updateAvailableIcon} aria-hidden />
      Update available
    </span>
  );
};

export default UpdateAvailableBadge;
