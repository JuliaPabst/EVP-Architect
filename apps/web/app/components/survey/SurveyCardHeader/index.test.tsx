import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import SurveyCardHeader from '.';

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

describe('SurveyCardHeader', () => {
  it('renders the title', () => {
    render(
      <SurveyCardHeader
        currentStep={1}
        title="Survey Step Title"
        totalSteps={5}
      />,
    );

    expect(screen.getByText('Survey Step Title')).toBeInTheDocument();
  });

  it('renders the step counter "2/5"', () => {
    render(<SurveyCardHeader currentStep={2} title="Step" totalSteps={5} />);

    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('renders ProgressBar with the correct percentage value (step 1 of 5 = 20)', () => {
    render(<SurveyCardHeader currentStep={1} title="Step" totalSteps={5} />);

    const progressBar = screen.getByTestId('progress-bar');

    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-value', '20');
  });
});
