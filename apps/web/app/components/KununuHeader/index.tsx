import Header from '@kununu/ui/organisms/Header';
import HeaderLogo from '@kununu/ui/organisms/Header/HeaderLogo';

export default function KununuHeader() {
  return (
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
  );
}
