import styles from './StatusBadge.module.css';

const StatusBadge = ({ text }: { text: string }) => {
  return (
    <span className={styles.statusBadge}>
      <span className={styles.statusBadgeDot} aria-hidden />
      {text}
    </span>
  );
};

export default StatusBadge;
