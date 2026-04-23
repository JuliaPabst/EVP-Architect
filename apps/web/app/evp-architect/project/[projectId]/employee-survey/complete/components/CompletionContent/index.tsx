'use client';

import styles from './index.module.scss';

export default function CompletionContent() {
  return (
    <div className={styles.stepContent}>
      <div className={styles.container}>
        <div className={styles.completionWrapper}>
          <div className={styles.checkmark}>✓</div>
          <h1 className={styles.title}>Vielen Dank für deine Teilnahme!</h1>
          <p className={styles.subtitle}>
            Deine Antworten wurden erfolgreich gespeichert.
          </p>
          <p className={styles.description}>
            Dein Beitrag hilft dabei, eine authentische und differenzierte EVP
            zu entwickeln, die die realen Erfahrungen der Mitarbeitenden
            widerspiegelt.
          </p>
        </div>
      </div>
    </div>
  );
}
