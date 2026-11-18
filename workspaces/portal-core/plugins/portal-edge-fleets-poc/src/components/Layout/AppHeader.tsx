import { Header, HeaderProps } from '@backstage/ui';

import styles from './AppHeader.module.css';

interface AppHeaderProps extends HeaderProps {
  title: string;
}

const AppHeader = ({ title, description, ...props }: AppHeaderProps) => {
  return (
    <Header
      className={styles.appHeader}
      title={title}
      description={description}
      {...props}
    />
  );
};

export default AppHeader;
