import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import EmployeeSurveyStep5 from './page';

jest.mock('@/app/components/survey/SurveyStepPageWrapper', () => {
  return function MockSurveyStepPageWrapper({children}: {children: ReactNode}) {
    return <div data-testid="survey-wrapper">{children}</div>;
  };
});

jest.mock('./components/Step5Content', () => {
  return function MockStep5Content({projectId}: {projectId: string}) {
    return <div data-project-id={projectId} data-testid="step5-content" />;
  };
});

describe('EmployeeSurveyStep5 page', () => {
  const mockParams = {projectId: 'proj-step5-test'};

  it('renders inside SurveyStepPageWrapper', () => {
    render(<EmployeeSurveyStep5 params={mockParams} />);

    expect(screen.getByTestId('survey-wrapper')).toBeInTheDocument();
  });

  it('renders Step5Content with the correct projectId', () => {
    render(<EmployeeSurveyStep5 params={mockParams} />);

    const content = screen.getByTestId('step5-content');

    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-project-id', 'proj-step5-test');
  });
});
