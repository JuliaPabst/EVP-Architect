import '@testing-library/jest-dom';

import {render, screen} from '@testing-library/react';

import Step4Content from '.';

jest.mock('../../../components/TextStep', () => {
  return function MockTextStep({
    projectId,
    stepNumber,
    stepTitle,
  }: {
    projectId: string;
    stepNumber: number;
    stepTitle: string;
  }) {
    return (
      <div data-testid="text-step">
        <span data-testid="project-id">{projectId}</span>
        <span data-testid="step-number">{stepNumber}</span>
        <span data-testid="step-title">{stepTitle}</span>
      </div>
    );
  };
});

describe('Step4Content', () => {
  const DEFAULT_PROPS = {projectId: 'test-project-101'};

  it('renders TextStep with stepTitle "Culture Fit"', () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent('Culture Fit');
  });

  it('renders TextStep with stepNumber 4', () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-number')).toHaveTextContent('4');
  });

  it('passes the projectId to TextStep', () => {
    render(<Step4Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('project-id')).toHaveTextContent(
      'test-project-101',
    );
  });
});
