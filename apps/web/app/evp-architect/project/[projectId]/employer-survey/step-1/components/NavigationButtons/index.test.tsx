import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NavigationButtons from '.';

jest.mock(
  '@kununu/ui/atoms/Button',
  () =>
    function MockButton({
      disabled,
      onClick,
      text,
    }: {
      text: string;
      disabled?: boolean;
      onClick?: () => void;
    }) {
      return (
        <button disabled={disabled} onClick={onClick} type="button">
          {text}
        </button>
      );
    },
);

// ButtonColor and ButtonSize are used only as enum values inside the component;
// no mock needed — the component imports them but they are not rendered.
jest.mock('@kununu/ui/shared/typings/button', () => ({
  ButtonColor: {PRIMARY: 'primary', SECONDARY: 'secondary'},
  ButtonSize: {M: 'm'},
}));

describe('NavigationButtons', () => {
  it('renders the Continue button by default', () => {
    render(<NavigationButtons />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeInTheDocument();
  });

  it('does NOT render the Back button by default (showBackButton=false)', () => {
    render(<NavigationButtons />);

    expect(
      screen.queryByRole('button', {name: 'Back'}),
    ).not.toBeInTheDocument();
  });

  it('renders the Back button when showBackButton=true and onBack is provided', () => {
    render(<NavigationButtons onBack={jest.fn()} showBackButton />);

    expect(screen.getByRole('button', {name: 'Back'})).toBeInTheDocument();
  });

  it('does NOT render the Back button when showBackButton=true but no onBack', () => {
    render(<NavigationButtons showBackButton />);

    expect(
      screen.queryByRole('button', {name: 'Back'}),
    ).not.toBeInTheDocument();
  });

  it('Continue button is disabled when canContinue=false (default)', () => {
    render(<NavigationButtons />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeDisabled();
  });

  it('Continue button is NOT disabled when canContinue=true', () => {
    render(<NavigationButtons canContinue />);

    expect(screen.getByRole('button', {name: 'Continue'})).toBeEnabled();
  });

  it('calls onContinue when the Continue button is clicked', async () => {
    const onContinue = jest.fn();

    render(<NavigationButtons canContinue onContinue={onContinue} />);

    await userEvent.click(screen.getByRole('button', {name: 'Continue'}));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when the Back button is clicked', async () => {
    const onBack = jest.fn();

    render(<NavigationButtons onBack={onBack} showBackButton />);

    await userEvent.click(screen.getByRole('button', {name: 'Back'}));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
