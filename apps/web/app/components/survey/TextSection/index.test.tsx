import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TextSection from '.';

jest.mock(
  '@kununu/ui/atoms/TextArea',
  () =>
    function MockTextArea({
      id,
      maxLength,
      onChange,
      placeholder,
      value,
    }: {
      id?: string;
      maxLength?: number;
      onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
      placeholder?: string;
      value?: string;
    }) {
      return (
        <textarea
          data-testid="textarea"
          id={id}
          maxLength={maxLength}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
      );
    },
);

describe('TextSection', () => {
  it('renders the title', () => {
    render(<TextSection title="My Section" />);

    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('renders the textarea with the provided value', () => {
    render(<TextSection title="My Section" value="Hello world" />);

    expect(screen.getByTestId('textarea')).toHaveValue('Hello world');
  });

  it('renders the placeholder', () => {
    render(<TextSection placeholder="Enter text here" title="My Section" />);

    expect(screen.getByTestId('textarea')).toHaveAttribute(
      'placeholder',
      'Enter text here',
    );
  });

  it('calls onChange when the textarea value changes', async () => {
    const onChange = jest.fn();

    render(<TextSection onChange={onChange} title="My Section" value="" />);

    await userEvent.type(screen.getByTestId('textarea'), 'A');

    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('syncs internal state when the external value prop changes', async () => {
    const {rerender} = render(
      <TextSection title="My Section" value="Initial" />,
    );

    expect(screen.getByTestId('textarea')).toHaveValue('Initial');

    rerender(<TextSection title="My Section" value="Updated" />);

    expect(screen.getByTestId('textarea')).toHaveValue('Updated');
  });

  it('derives the id from the title (lowercase, spaces replaced with dashes)', () => {
    render(<TextSection title="My Cool Section" />);

    expect(screen.getByTestId('textarea')).toHaveAttribute(
      'id',
      'text-section-my-cool-section',
    );
  });
});
