import '@testing-library/jest-dom';

import {render, screen} from '@testing-library/react';

import Step5Content from '.';

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

describe('Step5Content', () => {
  const DEFAULT_PROPS = {projectId: 'test-project-999'};

  it('renders TextStep with stepTitle "Differenzierung"', () => {
    render(<Step5Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent(
      'Differenzierung',
    );
  });

  it('renders TextStep with stepNumber 5', () => {
    render(<Step5Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-number')).toHaveTextContent('5');
  });

  it('passes the projectId to TextStep', () => {
    render(<Step5Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('project-id')).toHaveTextContent(
      'test-project-999',
    );
  });
});
