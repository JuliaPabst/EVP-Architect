'use client';

import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';

import SearchHeader from '../components/StartPage/SearchHeader';
import SelectedTopicsModule from '../components/StartPage/SelectedTopicsModule';

export default function EvpArchitect() {
  return (
    <div data-testid="evp-architect-page">
      <Header
        data-testid="header"
        logo={
          <HeaderLogo
            href="https://www.kununu.com/"
            label="Go to kununu"
            motto="Lets make work better."
          />
        }
      />
      <SearchHeader />
      <SelectedTopicsModule />
    </div>
  );
}
