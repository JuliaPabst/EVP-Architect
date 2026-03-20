import '@testing-library/jest-dom';
import type {ReactNode} from 'react';

import {render, screen} from '@testing-library/react';

import EmployeeSurveyStep3 from './page';

jest.mock('@/app/components/survey/SurveyStepPageWrapper', () => {
  return function MockSurveyStepPageWrapper({children}: {children: ReactNode}) {
    return <div data-testid="survey-wrapper">{children}</div>;
  };
});

jest.mock('./components/Step3Content', () => {
  return function MockStep3Content({projectId}: {projectId: string}) {
    return <div data-project-id={projectId} data-testid="step3-content" />;
  };
});

describe('EmployeeSurveyStep3 page', () => {
  const mockParams = {projectId: 'proj-step3-test'};

  it('renders inside SurveyStepPageWrapper', () => {
    render(<EmployeeSurveyStep3 params={mockParams} />);

    expect(screen.getByTestId('survey-wrapper')).toBeInTheDocument();
  });

  it('renders Step3Content with the correct projectId', () => {
    render(<EmployeeSurveyStep3 params={mockParams} />);

    const content = screen.getByTestId('step3-content');

    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-project-id', 'proj-step3-test');
  });
});
