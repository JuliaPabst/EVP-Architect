'use client';

import React from 'react';
import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';

export default function EvpArchitect() {
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
        <h1>EVP Architect</h1>
        <p>Welcome to the Employee Value Proposition Architect</p>
      </main>
    </div>
  );
}
