'use client';

import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';

import styles from './index.module.scss';

interface ProjectPageProps {
  readonly params: {
    readonly projectId: string;
  };
}

export default function ProjectPage({params}: ProjectPageProps) {
  const {projectId} = params;

  return (
    <div data-testid="project-page">
      <Header
        data-testid="header"
        logo={
          <HeaderLogo
            href="https://www.kununu.com/"
            label="Go to kununu"
            motto="Let's make work better."
          />
        }
      />
      <main className={styles.main} style={{padding: '2rem'}}>
        <h1>Project: {projectId}</h1>
        <p>This is the project page. Project details will be displayed here.</p>
      </main>
    </div>
  );
}
