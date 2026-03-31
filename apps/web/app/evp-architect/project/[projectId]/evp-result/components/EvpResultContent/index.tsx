'use client';

import {useState} from 'react';

import styles from './index.module.scss';

import useEvpResult from '@/app/hooks/useEvpResult';

interface EvpResultContentProps {
  readonly adminToken: string;
  readonly projectId: string;
}

export default function EvpResultContent({
  adminToken,
  projectId,
}: EvpResultContentProps) {
  const {error, evpText, isLoading, isRegenerating, regenerate} = useEvpResult(
    projectId,
    adminToken,
  );
  const [commentText, setCommentText] = useState('');

  async function handleRegenerate() {
    await regenerate(commentText);
    setCommentText('');
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.section}>
          <h1 className={styles.heading}>Your EVP</h1>

          {isLoading && (
            <p className={styles.loadingMessage}>Generating EVP…</p>
          )}

          {error && <p className={styles.errorMessage}>{error}</p>}

          {evpText && (
            <div className={styles.evpContent}>{evpText}</div>
          )}
        </section>

        {evpText && (
          <section className={styles.section}>
            <h2 className={styles.subHeading}>Adjust EVP</h2>

            <textarea
              className={styles.textarea}
              disabled={isRegenerating}
              onChange={(e) => setCommentText(e.currentTarget.value)}
              placeholder="Describe what you'd like to change…"
              value={commentText}
            />

            <button
              className={styles.button}
              disabled={isRegenerating || !commentText.trim()}
              onClick={handleRegenerate}
              type="button"
            >
              {isRegenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
