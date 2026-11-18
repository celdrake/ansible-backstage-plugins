import { CardHeader, Flex, Text } from '@backstage/ui';

import styles from './FleetDetailsCardHeader.module.css';

const FleetDetailsCardHeader = ({
  title,
  meta,
  description,
}: {
  title: string;
  meta?: React.ReactNode;
  description?: React.ReactNode;
}) => {
  return (
    <CardHeader>
      <Flex
        direction="column"
        gap="1"
        className={styles.fleetDetailsCardHeaderTitle}
      >
        <Flex justify="between" align="center" gap="3">
          <Text weight="bold">{title}</Text>
          {meta && (
            <div className={styles.fleetDetailsCardHeaderTitleMeta}>{meta}</div>
          )}
        </Flex>
        {description && (
          <Text variant="body-small" color="secondary">
            {description}
          </Text>
        )}
      </Flex>
    </CardHeader>
  );
};

export default FleetDetailsCardHeader;
