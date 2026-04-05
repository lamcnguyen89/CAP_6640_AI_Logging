import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for the matchers
import { describe, it, expect, vi } from 'vitest'; // Use `vi` for mocks in Vitest
import Checkbox from './Checkbox'; // Adjust the import path as necessary

describe('Checkbox Component', () => {
  it('renders the checkbox with the provided label', () => {
    render(<Checkbox id="accept-terms" label="Accept Terms" />);

    // Check if the checkbox label is rendered correctly
    expect(screen.getByLabelText('Accept Terms')).toBeInTheDocument();
  });

  it('applies custom classes and attributes correctly', () => {
    render(
      <Checkbox
        id="accept-terms"
        label="Accept Terms"
        classname="custom-checkbox"
        disable={true}
        inline={true}
      />
    );

    const checkboxElement = screen.getByLabelText('Accept Terms');

    // Check if the checkbox has the correct custom class
    expect(checkboxElement).toHaveClass('form-check-input');

    // Check if the checkbox is disabled
    expect(checkboxElement).toBeDisabled();
  });

  it('calls onChange handler when checkbox state changes', () => {
    const handleChange = vi.fn(); // Use `vi.fn()` instead of `jest.fn()`

    render(
      <Checkbox
        id="subscribe-newsletter"
        label="Subscribe to newsletter"
        onChange={handleChange}
      />
    );

    // Simulate a change event on the checkbox
    fireEvent.click(screen.getByLabelText('Subscribe to newsletter'));

    // Check if the onChange handler was called
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('checkbox is checked based on the checked prop', () => {
    render(
      <Checkbox
        id="receive-updates"
        label="Receive updates"
        checked={true}
      />
    );

    const checkboxElement = screen.getByLabelText('Receive updates');

    // Check if the checkbox is checked
    expect(checkboxElement).toBeChecked();
  });
});
