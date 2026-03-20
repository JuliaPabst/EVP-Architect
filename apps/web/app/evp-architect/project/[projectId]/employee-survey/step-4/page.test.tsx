import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import EmployeeSurveyStep4 from './page';

jest.mock('@/app/components/survey/SurveyStepPageWrapper', () => {
  return function MockSurveyStepPageWrapper({children}: {children: ReactNode}) {
    return <div data-testid="survey-wrapper">{children}</div>;
  };
});

jest.mock('./components/Step4Content', () => {
  return function MockStep4Content({projectId}: {projectId: string}) {
    return <div data-project-id={projectId} data-testid="step4-content" />;
  };
});

describe('EmployeeSurveyStep4 page', () => {
  const mockParams = {projectId: 'proj-step4-test'};

  it('renders inside SurveyStepPageWrapper', () => {
    render(<EmployeeSurveyStep4 params={mockParams} />);

    expect(screen.getByTestId('survey-wrapper')).toBeInTheDocument();
  });

  it('renders Step4Content with the correct projectId', () => {
    render(<EmployeeSurveyStep4 params={mockParams} />);

    const content = screen.getByTestId('step4-content');

    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-project-id', 'proj-step4-test');
  });
});
