import '@testing-library/jest-dom';

import {render, screen} from '@testing-library/react';

import Step2Content from '.';

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

describe('Step2Content', () => {
  const DEFAULT_PROPS = {projectId: 'test-project-456'};

  it('renders TextStep with stepTitle "Moment der Zugehörigkeit"', () => {
    render(<Step2Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-title')).toHaveTextContent(
      'Moment der Zugehörigkeit',
    );
  });

  it('renders TextStep with stepNumber 2', () => {
    render(<Step2Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('step-number')).toHaveTextContent('2');
  });

  it('passes the projectId to TextStep', () => {
    render(<Step2Content {...DEFAULT_PROPS} />);

    expect(screen.getByTestId('project-id')).toHaveTextContent(
      'test-project-456',
    );
  });
});
