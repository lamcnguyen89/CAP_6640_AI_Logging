import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Ensure jest-dom is imported for matchers like toBeInTheDocument and toHaveStyle
import { describe, it, expect, vi } from 'vitest'; // Use `vi` for mocks in Vitest
import ModalButton2 from './Buttons'; // Adjust the import path accordingly

describe('ModalButton2 Component', () => {
  it('renders the button with the provided text and class', () => {
    render(
      <ModalButton2
        text="Click Me"
        classname="custom-button"
        variant="primary"
      />
    );

    // Check if the button text is rendered correctly
    expect(screen.getByText('Click Me')).toBeInTheDocument();

    // Check if the button has the correct class
    expect(screen.getByText('Click Me')).toHaveClass('custom-button');

    // Check if the button has the correct variant class
    expect(screen.getByText('Click Me')).toHaveClass('btn-primary');
  });

  it('calls the onClick handler when clicked', () => {
    const handleClick = vi.fn(); // Use `vi.fn()` instead of `jest.fn()`

    render(
      <ModalButton2
        text="Click Me"
        onClick={handleClick}
      />
    );

    // Simulate a click on the button
    fireEvent.click(screen.getByText('Click Me'));

    // Check if the click handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom styles from props', () => {
    render(
      <ModalButton2
        text="Custom Color"
        btncolor="red"
      />
    );

    // Check if the button has the correct custom style
    expect(screen.getByText('Custom Color')).toHaveStyle({ backgroundColor: 'red' });
  });
});
