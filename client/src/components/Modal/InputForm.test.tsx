import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InputForm from './InputForm'; // Adjust the path as necessary

describe('InputForm Component', () => {
  test('renders input with the provided label', () => {
    render(<InputForm label="Username" type="text" />);

    // Check if the label is rendered correctly
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  test('renders input of type text correctly', () => {
    render(<InputForm type="text" placeholder="Enter your name" />);

    // Check if the input is rendered with correct placeholder
    const inputElement = screen.getByPlaceholderText('Enter your name');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'text');
  });

  test('renders select input with provided items', () => {
    const items = [
      { name: 'Option 1', classname: 'option-class-1' },
      { name: 'Option 2', classname: 'option-class-2' },
    ];
    render(<InputForm type="select" items={items} />);

    // Check if select input and items are rendered correctly
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  test('calls onChange handler when input value changes', () => {
    const handleChange = vi.fn(); // Using `vi.fn()` instead of `jest.fn()` for Vitest compatibility
    render(<InputForm type="text" onChange={handleChange} />);

    // Simulate change event
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'John Doe' } });

    // Check if onChange handler is called
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('calls onKeyUp handler when a key is pressed', () => {
    const handleKeyUp = vi.fn(); // Using `vi.fn()` instead of `jest.fn()` for Vitest compatibility
    render(<InputForm type="text" onKeyup={handleKeyUp} />);

    // Simulate key up event
    fireEvent.keyUp(screen.getByRole('textbox'), { key: 'Enter' });

    // Check if onKeyUp handler is called
    expect(handleKeyUp).toHaveBeenCalledTimes(1);
  });

  test('renders input with the correct custom class', () => {
    render(<InputForm type="text" classname="custom-class" />);

    // Check if the input has the correct custom class
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveClass('custom-class');
  });

  test('renders multiple select input when multiple prop is true', () => {
    const items = [
      { name: 'Option 1', classname: 'option-class-1' },
      { name: 'Option 2', classname: 'option-class-2' },
    ];
    render(<InputForm type="select" items={items} multiple={true} />);

    // Check if the select input has multiple attribute
    const selectElement = screen.getByRole('listbox');
    expect(selectElement).toBeInTheDocument();
    expect(selectElement).toHaveAttribute('multiple');
  });
});
