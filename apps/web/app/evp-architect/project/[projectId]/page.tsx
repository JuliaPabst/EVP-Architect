'use client';

import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectPage({params}: ProjectPageProps) {
  const {projectId} = params;

  return (
    <div>
      <Header
        logo={
          <HeaderLogo
            href="https://www.kununu.com/"
            label="Go to kununu"
            motto="Lets make work better."
          />
        }
      />
      <main style={{padding: '2rem'}}>
        <h1>Project: {projectId}</h1>
        <p>This is the project page. Project details will be displayed here.</p>
      </main>
    </div>
  );
}
