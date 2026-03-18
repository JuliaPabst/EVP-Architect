import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ProgressHeader from '.';

jest.mock(
  '@kununu/ui/atoms/ProgressBar',
  () =>
    function MockProgressBar({value}: {value: number}) {
      return <div data-testid="progress-bar" data-value={String(value)} />;
    },
);

jest.mock('@kununu/ui/atoms/ProgressBar/typings', () => ({
  ProgressBarType: {INFO: 'info'},
}));

jest.mock(
  '@kununu/ui/particles/Icons/System/Close',
  () =>
    function MockClose() {
      return <span>close</span>;
    },
);

describe('ProgressHeader', () => {
  const defaultProps = {
    currentStep: 2,
    title: 'Survey Title',
    totalSteps: 5,
  };

  it('renders the title', () => {
    render(<ProgressHeader {...defaultProps} />);

    expect(screen.getByText('Survey Title')).toBeInTheDocument();
  });

  it('renders the step counter like "2/5"', () => {
    render(<ProgressHeader {...defaultProps} />);

    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('renders the progress bar', () => {
    render(<ProgressHeader {...defaultProps} />);

    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('renders the back button when onBack is provided (aria-label="Go back")', () => {
    render(<ProgressHeader {...defaultProps} onBack={jest.fn()} />);

    expect(screen.getByRole('button', {name: 'Go back'})).toBeInTheDocument();
  });

  it('does NOT render the back button when no onBack is provided', () => {
    render(<ProgressHeader {...defaultProps} />);

    expect(
      screen.queryByRole('button', {name: 'Go back'}),
    ).not.toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', async () => {
    const onBack = jest.fn();

    render(<ProgressHeader {...defaultProps} onBack={onBack} />);

    await userEvent.click(screen.getByRole('button', {name: 'Go back'}));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
