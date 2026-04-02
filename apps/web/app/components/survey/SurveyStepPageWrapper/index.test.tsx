import '@testing-library/jest-dom';

import {render, screen} from '@testing-library/react';

import SurveyStepPageWrapper from '.';

jest.mock('@/app/components/KununuHeader', () => {
  return function MockKununuHeader() {
    return <header data-testid="header" />;
  };
});

jest.mock('@kununu/ui/atoms/UnunuBackground', () => ({
  __esModule: true,
  /* eslint-disable sort-keys */
  default: function MockBg() {
    return null;
  },

  UnunuBackgroundColors: {YELLOW: 'yellow'},
}));

describe('SurveyStepPageWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when isValidating is false (default)', () => {
    render(
      <SurveyStepPageWrapper>
        <div data-testid="child-content">Survey Content</div>
      </SurveyStepPageWrapper>,
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('shows loading indicator when isValidating is true', () => {
    render(
      <SurveyStepPageWrapper isValidating>
        <div data-testid="child-content">Survey Content</div>
      </SurveyStepPageWrapper>,
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render children when isValidating is true', () => {
    render(
      <SurveyStepPageWrapper isValidating>
        <div data-testid="child-content">Survey Content</div>
      </SurveyStepPageWrapper>,
    );

    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('renders KununuHeader regardless of validation state', () => {
    render(
      <SurveyStepPageWrapper>
        <div>Content</div>
      </SurveyStepPageWrapper>,
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
