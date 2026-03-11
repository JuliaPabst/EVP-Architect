'use client';

import styles from './index.module.scss';

import KununuHeader from '@/app/components/KununuHeader';

interface ProjectPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function ProjectPage({params}: ProjectPageProps) {
  const {projectId} = params;

  return (
    <div data-testid="project-page">
      <KununuHeader />
      <main className={styles.main} style={{padding: '2rem'}}>
        <h1>Project: {projectId}</h1>
        <p>This is the project page. Project details will be displayed here.</p>
      </main>
    </div>
  );
}
