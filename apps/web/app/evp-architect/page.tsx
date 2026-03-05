'use client';

import KununuHeader from '../components/KununuHeader';
import SearchHeader from '../components/StartPage/SearchHeader';
import SelectedTopicsModule from '../components/StartPage/SelectedTopicsModule';

export default function EvpArchitect() {
  return (
    <div data-testid="evp-architect-page">
      <KununuHeader />
      <SearchHeader />
      <SelectedTopicsModule />
    </div>
  );
}
