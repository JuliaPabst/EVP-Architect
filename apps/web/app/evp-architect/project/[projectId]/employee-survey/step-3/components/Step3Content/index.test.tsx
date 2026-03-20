import '@testing-library/jest-dom';

import {render, screen} from '@testing-library/react';

import Step3Content from '.';

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

describe('Step3Content', () => {
  const DEFAULT_PROPS = {projectId: 'test-project-789'};

  it('renders TextStep with stepTitle "Daily Work Reality"', () => {
    render(<Step3Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent(
      'Daily Work Reality',
    );
  });

  it('renders TextStep with stepNumber 3', () => {
    render(<Step3Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-number')).toHaveTextContent('3');
  });

  it('passes the projectId to TextStep', () => {
    render(<Step3Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('project-id')).toHaveTextContent(
      'test-project-789',
    );
  });
});
