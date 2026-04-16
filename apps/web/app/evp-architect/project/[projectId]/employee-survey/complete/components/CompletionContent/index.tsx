'use client';

import styles from './index.module.scss';

export default function CompletionContent() {
  return (
    <div className={styles.stepContent}>
      <div className={styles.container}>
        <div className={styles.completionWrapper}>
          <div className={styles.checkmark}>✓</div>
          <h1 className={styles.title}>Thank you for your participation!</h1>
          <p className={styles.subtitle}>
            Your answers have been saved successfully.
          </p>
          <p className={styles.description}>
            Your contribution helps develop an authentic and differentiated EVP
            that reflects the real experiences of employees.
          </p>
        </div>
      </div>
    </div>
  );
}
