import styles from "./skeleton.module.css";

type SkeletonProps = {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
};

export function Skeleton({
  width = "100%",
  height = "20px",
  borderRadius = "12px",
  className,
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ""}`}
      style={{ width, height, borderRadius }}
      role="presentation"
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className ?? ""}`} role="presentation" aria-hidden="true">
      <Skeleton height="180px" borderRadius="20px" />
      <div className={styles.cardBody}>
        <Skeleton width="40%" height="12px" />
        <Skeleton width="80%" height="18px" />
        <Skeleton width="60%" height="14px" />
        <div className={styles.cardFooter}>
          <Skeleton width="30%" height="16px" />
          <Skeleton width="80px" height="36px" borderRadius="999px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`${styles.grid} ${className ?? ""}`} role="presentation" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
