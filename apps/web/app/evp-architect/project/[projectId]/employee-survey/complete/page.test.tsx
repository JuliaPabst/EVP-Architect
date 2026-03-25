import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import EmployeeSurveyComplete from './page';

jest.mock('@/app/components/survey/SurveyStepPageWrapper', () => {
  return function MockSurveyStepPageWrapper({children}: {children: ReactNode}) {
    return <div data-testid="survey-wrapper">{children}</div>;
  };
});

jest.mock('./components/CompletionContent', () => {
  return function MockCompletionContent() {
    return <div data-testid="completion-content" />;
  };
});

describe('EmployeeSurveyComplete page', () => {
  it('renders inside SurveyStepPageWrapper', () => {
    render(<EmployeeSurveyComplete />);

    expect(screen.getByTestId('survey-wrapper')).toBeInTheDocument();
  });

  it('renders the CompletionContent component', () => {
    render(<EmployeeSurveyComplete />);

    expect(screen.getByTestId('completion-content')).toBeInTheDocument();
  });
});
