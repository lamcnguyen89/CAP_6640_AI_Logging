import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for the matchers
import { describe, it, expect, vi } from 'vitest'; // Use `vi` for mocks in Vitest
import Cards from './Cards'; // Adjust the import path as necessary

describe('Cards Component Tests', () => {
  const defaultProps = {
    title: 'Test Title',
    id: 'card1',
    classname: 'custom-class',
    image: 'test-image-url.jpg',
    text: 'This is a test description.',
    idx: 1,
    onClick: vi.fn(), // Use `vi.fn()` instead of `jest.fn()`
    style: { color: 'red' },
  };

  it('renders the card with correct content', () => {
    render(<Cards {...defaultProps} />);

    expect(screen.getByText('Title: Test Title')).toBeInTheDocument();
    expect(screen.getByText('Description: This is a test description.')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'test-image-url.jpg');
  });

  it('calls onClick when card is clicked', () => {
    render(<Cards {...defaultProps} />);
    
    const card = screen.getByRole('img').closest('.card'); // Getting the closest card container
    fireEvent.click(card!);

    expect(defaultProps.onClick).toHaveBeenCalled();
  });
});
