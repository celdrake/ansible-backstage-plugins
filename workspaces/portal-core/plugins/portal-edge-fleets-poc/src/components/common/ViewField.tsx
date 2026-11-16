import { Text } from '@backstage/ui';

import styles from './ViewField.module.css';

const ViewField = ({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) => {
  return (
    <div className={styles.viewField}>
      <Text
        variant="body-small"
        color="secondary"
        className={styles.viewFieldLabel}
      >
        {label}
      </Text>
      <div className={styles.viewFieldValue}>{children}</div>
    </div>
  );
};

export default ViewField;
