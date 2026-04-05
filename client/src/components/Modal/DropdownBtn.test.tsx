import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest'; // Use `vi` for mocks in Vitest
import DropdownBtn from './DropdownBtn'; // Adjust the import path as necessary

describe('DropdownBtn Component', () => {
  const mockItems = [
    { name: 'Item 1', classname: 'item-class-1' },
    { name: 'Item 2', classname: 'item-class-2' },
    { name: 'Item 3', classname: 'item-class-3' },
  ];

  const mockOnSelect = vi.fn(); // Use `vi.fn()` instead of `jest.fn()`

  it('renders the dropdown button with the correct title', () => {
    render(<DropdownBtn title="Options" items={mockItems} id="dropdown-basic" />);

    // Check if the dropdown button is rendered correctly
    expect(screen.getByText('Options')).toBeInTheDocument();
  });

  it('applies custom classes to the dropdown button', () => {
    render(<DropdownBtn title="Options" items={mockItems} id="dropdown-basic" classname="custom-dropdown-class" />);

    // Check if the dropdown button has the correct custom class applied
    expect(screen.getByText('Options').closest('div')).toHaveClass('custom-dropdown-class');
  });
});
