import { Link, Text } from '@backstage/ui';
import { RiArrowRightSLine } from '@remixicon/react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

// CELIA-WIP: styles
const styles = {
  breadcrumbs: 'fake-breadcrumbs',
  breadcrumbList: 'fake-breadcrumb-list',
  breadcrumbItem: 'fake-breadcrumb-item',
  breadcrumbSep: 'fake-breadcrumb-sep',
  breadcrumbCurrent: 'fake-breadcrumb-current',
  breadcrumbLink: 'fake-breadcrumb-link',
};
const AppBreadcrumbs = ({ items }: { items: BreadcrumbItem[] | undefined }) => {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol className={styles.breadcrumbList}>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1 || !item.href;
          return (
            <li
              key={`${item.label}-${index}`}
              className={styles.breadcrumbItem}
            >
              {index > 0 ? (
                <RiArrowRightSLine
                  className={styles.breadcrumbSep}
                  size={14}
                  aria-hidden
                />
              ) : null}
              {isCurrent ? (
                <Text
                  variant="body-small"
                  className={styles.breadcrumbCurrent}
                  aria-current="page"
                >
                  {item.label}
                </Text>
              ) : (
                <Link
                  href={item.href!}
                  variant="body-small"
                  className={styles.breadcrumbLink}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default AppBreadcrumbs;
