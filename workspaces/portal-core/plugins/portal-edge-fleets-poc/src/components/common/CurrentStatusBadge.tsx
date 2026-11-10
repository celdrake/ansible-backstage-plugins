import styles from './CurrentStatusBadge.module.css';

const CurrentStatusBadge = ({ text }: { text: string }) => {
  return (
    <span className={styles.currentStatusBadge}>
      <span className={styles.currentStatusBadgeDot} aria-hidden />
      {text}
    </span>
  );
};

export default CurrentStatusBadge;
