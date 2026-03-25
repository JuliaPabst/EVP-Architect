import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import EmployeeSurveyStep1 from './page';

jest.mock('@/app/components/survey/SurveyStepPageWrapper', () => {
  return function MockSurveyStepPageWrapper({children}: {children: ReactNode}) {
    return <div data-testid="survey-wrapper">{children}</div>;
  };
});

jest.mock('./components/Step1Content', () => {
  return function MockStep1Content({projectId}: {projectId: string}) {
    return <div data-project-id={projectId} data-testid="step1-content" />;
  };
});

describe('EmployeeSurveyStep1 page', () => {
  const mockParams = {projectId: 'proj-step1-test'};

  it('renders inside SurveyStepPageWrapper', () => {
    render(<EmployeeSurveyStep1 params={mockParams} />);

    expect(screen.getByTestId('survey-wrapper')).toBeInTheDocument();
  });

  it('renders Step1Content with the correct projectId', () => {
    render(<EmployeeSurveyStep1 params={mockParams} />);

    const content = screen.getByTestId('step1-content');

    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-project-id', 'proj-step1-test');
  });
});
