import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Ensure jest-dom is imported for matchers like toBeInTheDocument and toHaveStyle
import { describe, it, expect, vi } from 'vitest'; // Use `vi` for mocks in Vitest
import ModalButton from './Button'; // Adjust the import path accordingly

describe('ModalButton Component Tests', () => {
  it('renders the button with the provided text and class', () => {
    const props = {
      btncolor: 'red',
      text: 'Click Me',
      className: 'custom-button-class' // If there's a custom class
    };

    render(<ModalButton {...props} />);

    const button = screen.getByText('Click Me');
    expect(button).toBeInTheDocument(); // Check if the button text is rendered correctly
    expect(button).toHaveStyle({ backgroundColor: props.btncolor }); // Check if the button has the correct background color
  });

  it('calls the onClick handler when clicked', () => {
    const handleClick = vi.fn(); // Use `vi.fn()` instead of `jest.fn()`
    const props = {
      btncolor: 'blue',
      text: 'Submit',
      onClick: handleClick
    };

    render(<ModalButton {...props} />);
    const button = screen.getByText('Submit');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1); // Check if the click handler was called
  });

  it('applies custom styles from props', () => {
    const props = {
      btncolor: 'red',
      text: 'Custom Color'
    };

    render(<ModalButton {...props} />);

    // Check if the button has the correct custom style
    expect(screen.getByText('Custom Color')).toHaveStyle({ backgroundColor: 'red' });
  });
});
