import { type FC } from "react";
import styles from "./SkeletonLoader.module.css";

const InlineSkeletonLoader: FC = () => {
  return <span className={styles.skeleton_inline} />;
};

export default InlineSkeletonLoader;
