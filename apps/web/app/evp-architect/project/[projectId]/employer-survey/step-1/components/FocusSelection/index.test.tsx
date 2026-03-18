import '@testing-library/jest-dom';
import type {ChangeEvent} from 'react';

import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FocusSelection from '.';

jest.mock('@kununu/ui/atoms/ChoiceChip', () => {
  return function MockChoiceChip({
    checked,
    disabled,
    id,
    onChange,
    text,
  }: {
    checked: boolean;
    id: string;
    text: string;
    disabled?: boolean;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  }) {
    return (
      <input
        aria-label={text}
        checked={checked}
        data-testid={id}
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
      />
    );
  };
});

jest.mock('@kununu/ui/particles/Icons/System/SuccessInverted', () => {
  return function MockSuccessInverted() {
    return <div data-testid="success-icon" />;
  };
});

const OPTIONS = [
  {id: 'opt-1', label: 'Option One'},
  {id: 'opt-2', label: 'Option Two'},
  {id: 'opt-3', label: 'Option Three'},
  {id: 'opt-4', label: 'Option Four'},
  {id: 'opt-5', label: 'Option Five'},
];

describe('FocusSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    render(<FocusSelection options={OPTIONS} title="Pick your focus areas" />);

    expect(screen.getByText('Pick your focus areas')).toBeInTheDocument();
  });

  it('renders all options as chips', () => {
    render(<FocusSelection options={OPTIONS} title="Pick your focus areas" />);

    for (const option of OPTIONS) {
      expect(screen.getByTestId(option.id)).toBeInTheDocument();
      expect(screen.getByLabelText(option.label)).toBeInTheDocument();
    }
  });

  it('calls onChange with updated selection when a chip is selected', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <FocusSelection
        onChange={handleChange}
        options={OPTIONS}
        title="Pick your focus areas"
      />,
    );

    await user.click(screen.getByLabelText('Option One'));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(['opt-1']);
  });

  it('calls onChange with reduced selection when a chip is deselected', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <FocusSelection
        initialValue={['opt-1', 'opt-2']}
        onChange={handleChange}
        options={OPTIONS}
        title="Pick your focus areas"
      />,
    );

    await user.click(screen.getByLabelText('Option One'));

    expect(handleChange).toHaveBeenCalledWith(['opt-2']);
  });

  it('does not exceed maxSelections and disables unselected chips when max reached', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <FocusSelection
        initialValue={['opt-1', 'opt-2']}
        maxSelections={2}
        onChange={handleChange}
        options={OPTIONS}
        title="Pick your focus areas"
      />,
    );

    // opt-3, opt-4, opt-5 are unselected and should be disabled
    expect(screen.getByTestId('opt-3')).toBeDisabled();
    expect(screen.getByTestId('opt-4')).toBeDisabled();
    expect(screen.getByTestId('opt-5')).toBeDisabled();

    // Attempting to click a disabled chip does not call onChange
    await user.click(screen.getByLabelText('Option Three'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('shows success indicator when selectedCount meets minSelections', async () => {
    const user = userEvent.setup();

    render(
      <FocusSelection
        initialValue={['opt-1', 'opt-2']}
        minSelections={2}
        options={OPTIONS}
        title="Pick your focus areas"
      />,
    );

    expect(screen.getByTestId('success-icon')).toBeInTheDocument();

    // Select one more to keep meeting the minimum
    await user.click(screen.getByLabelText('Option Three'));

    expect(screen.getByTestId('success-icon')).toBeInTheDocument();
  });

  it('does not show success indicator when selectedCount is below minSelections', () => {
    render(
      <FocusSelection
        minSelections={3}
        options={OPTIONS}
        title="Pick your focus areas"
      />,
    );

    expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument();
  });

  it('syncs internal state when initialValue changes', () => {
    const {rerender} = render(
      <FocusSelection
        initialValue={['opt-1']}
        options={OPTIONS}
        title="Pick your focus areas"
      />,
    );

    expect(screen.getByTestId('opt-1')).toBeChecked();
    expect(screen.getByTestId('opt-2')).not.toBeChecked();

    rerender(
      <FocusSelection
        initialValue={['opt-2', 'opt-3']}
        options={OPTIONS}
        title="Pick your focus areas"
      />,
    );

    expect(screen.getByTestId('opt-1')).not.toBeChecked();
    expect(screen.getByTestId('opt-2')).toBeChecked();
    expect(screen.getByTestId('opt-3')).toBeChecked();
  });
});
