import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Paginations from './Paginations'; // Adjust the path as necessary

describe('Paginations Component', () => {
  test('renders pagination items correctly', () => {
    render(<Paginations firstPage={1} lastPage={5} currentPage={3} classname="custom-pagination" />);

    // Check if all pagination items are rendered
    const paginationItems = screen.getAllByRole('listitem');
    expect(paginationItems).toHaveLength(5); // 1 to 5 pages

    // Check if the current page is set as active
    expect(paginationItems[2]).toHaveClass('active'); // The third item should be active (page 3)
  });

  test('calls onClick handler when a pagination item is clicked', () => {
    const handleClick = vi.fn(); // Using `vi.fn()` instead of `jest.fn()` for Vitest compatibility
    render(<Paginations firstPage={1} lastPage={3} currentPage={1} classname="custom-pagination" onClick={handleClick} />);

    // Click on the second pagination item
    fireEvent.click(screen.getByText('2'));

    // Check if the onClick handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom class to the pagination component', () => {
    render(<Paginations firstPage={1} lastPage={3} currentPage={1} classname="custom-pagination" />);

    // Check if the pagination has the correct custom class
    const paginationElement = screen.getByRole('list');
    expect(paginationElement).toHaveClass('custom-pagination');
  });

  test('renders correct number of pagination items based on props', () => {
    render(<Paginations firstPage={1} lastPage={7} currentPage={4} classname="custom-pagination" />);

    // Check if all pagination items are rendered
    const paginationItems = screen.getAllByRole('listitem');
    expect(paginationItems).toHaveLength(7); // 1 to 7 pages
  });
});
