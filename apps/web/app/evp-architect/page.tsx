'use client';

import React from 'react';
import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';
import SearchHeader from '../components/SearchHeader';

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
      <SearchHeader />
    </div>
  );
}
