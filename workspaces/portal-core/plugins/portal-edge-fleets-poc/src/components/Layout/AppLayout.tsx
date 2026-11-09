import React from 'react';
import { RiCloudLine } from '@remixicon/react';
import { Container, Flex, PluginHeader } from '@backstage/ui';
import AppBreadcrumbs, { BreadcrumbItem } from './AppBreadcrumbs';

type AppLayoutProps = {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  headerActions?: React.ReactNode;
  header?: React.ReactNode;
};

// CELIA-WIP: titleLink
// CELIA-WIP: TITLE DOES NOT HAVE THE EXPECTED FONT-SIZE, CHECK LATER
// Somehow the title is in Breadcrumbs, and has a "font-size: inherit" rule that stays even
// after setting "font-size: 1.5em !important" in the header.
const AppLayout = ({
  title = 'Edge',
  breadcrumbs,
  headerActions,
  header,
  children,
}: React.PropsWithChildren<AppLayoutProps>) => {
  return (
    <Flex direction="column" gap="0">
      <PluginHeader
        title={title}
        titleLink="ROUTE TBD"
        icon={<RiCloudLine aria-hidden="true" />}
        customActions={headerActions}
      />
      <AppBreadcrumbs items={breadcrumbs} />

      {header}
      <Container>{children}</Container>
    </Flex>
  );
};

export default AppLayout;
