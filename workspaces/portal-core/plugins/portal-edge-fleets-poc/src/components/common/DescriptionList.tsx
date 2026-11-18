import { Text } from '@backstage/ui';

import styles from './DescriptionList.module.css';

export const DescriptionListItem = ({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) => {
  return (
    <div className={styles.descriptionListItem}>
      <dt className={styles.descriptionListItemLabel}>
        <Text variant="body-small">{label}</Text>
      </dt>
      <dd className={styles.descriptionListItemValue}>{children}</dd>
    </div>
  );
};

const DescriptionList = ({ children }: React.PropsWithChildren) => {
  return <dl className={styles.descriptionList}>{children}</dl>;
};

export default DescriptionList;
