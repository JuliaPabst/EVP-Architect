import '@testing-library/jest-dom';

import {render, screen} from '@testing-library/react';

import CompletionContent from '.';

jest.mock('./index.module.scss', () => ({
  checkmark: 'checkmark',
  completionWrapper: 'completionWrapper',
  container: 'container',
  description: 'description',
  stepContent: 'stepContent',
  subtitle: 'subtitle',
  title: 'title',
}));

describe('CompletionContent', () => {
  it('renders the checkmark symbol', () => {
    render(<CompletionContent />);

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders the thank-you heading', () => {
    render(<CompletionContent />);

    expect(screen.getByRole('heading', {level: 1})).toHaveTextContent(
      'Vielen Dank für deine Teilnahme!',
    );
  });

  it('renders the subtitle about saved answers', () => {
    render(<CompletionContent />);

    expect(
      screen.getByText('Deine Antworten wurden erfolgreich gespeichert.'),
    ).toBeInTheDocument();
  });

  it('renders the EVP description text', () => {
    render(<CompletionContent />);

    expect(
      screen.getByText(/authentische und differenzierte EVP/),
    ).toBeInTheDocument();
  });
});
