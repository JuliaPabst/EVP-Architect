import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';

import StepContentLayout from '.';

jest.mock(
  '../SurveyCardHeader',
  () =>
    function MockSurveyCardHeader({title}: {title: string}) {
      return <div data-testid="survey-card-header">{title}</div>;
    },
);

describe('StepContentLayout', () => {
  const defaultProps = {
    children: <p>Child content</p>,
    currentStep: 2,
    isLoading: false,
    stepTitle: 'Step Two',
    totalSteps: 5,
  };

  it('renders children when not loading and no error', () => {
    render(<StepContentLayout {...defaultProps} />);

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows "Loading survey questions..." when isLoading=true', () => {
    render(<StepContentLayout {...defaultProps} isLoading />);

    expect(screen.getByText('Loading survey questions...')).toBeInTheDocument();
  });

  it('does NOT show children when isLoading=true', () => {
    render(<StepContentLayout {...defaultProps} isLoading />);

    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('shows the error message when error is provided and not loading', () => {
    render(
      <StepContentLayout {...defaultProps} error="Something went wrong" />,
    );

    expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
  });

  it('does NOT show children when error is set and not loading', () => {
    render(
      <StepContentLayout {...defaultProps} error="Something went wrong" />,
    );

    expect(screen.queryByText('Child content')).not.toBeInTheDocument();
  });

  it('renders SurveyCardHeader with stepTitle and step info', () => {
    render(<StepContentLayout {...defaultProps} />);

    const header = screen.getByTestId('survey-card-header');

    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Step Two');
  });

  it('does NOT show an error when error is null', () => {
    render(<StepContentLayout {...defaultProps} error={null} />);

    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });
});
