import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import EmployeeSurveyStep2 from './page';

jest.mock('@/app/components/survey/SurveyStepPageWrapper', () => {
  return function MockSurveyStepPageWrapper({children}: {children: ReactNode}) {
    return <div data-testid="survey-wrapper">{children}</div>;
  };
});

jest.mock('./components/Step2Content', () => {
  return function MockStep2Content({projectId}: {projectId: string}) {
    return <div data-project-id={projectId} data-testid="step2-content" />;
  };
});

describe('EmployeeSurveyStep2 page', () => {
  const mockParams = {projectId: 'proj-step2-test'};

  it('renders inside SurveyStepPageWrapper', () => {
    render(<EmployeeSurveyStep2 params={mockParams} />);

    expect(screen.getByTestId('survey-wrapper')).toBeInTheDocument();
  });

  it('renders Step2Content with the correct projectId', () => {
    render(<EmployeeSurveyStep2 params={mockParams} />);

    const content = screen.getByTestId('step2-content');

    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-project-id', 'proj-step2-test');
  });
});
