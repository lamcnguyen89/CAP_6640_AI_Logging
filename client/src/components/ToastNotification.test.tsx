import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest'; // Import Vitest methods
import '@testing-library/jest-dom'; // Ensure this is imported for toBeInTheDocument
import ToastNotification from './ToastNotification'; // Adjust the import path if necessary

describe('ToastNotification Component', () => {
  const changeStateMock = vi.fn(); // Mock function

  it('should render the toast and display the correct content when visible is true', () => {
    render(<ToastNotification visible={true} changeState={changeStateMock} />);

    // Assert that the toast header and body content are rendered
    expect(screen.getByText(/Check your email to Verify Account!!!/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to Vera/i)).toBeInTheDocument();
  });

  it('should not render the toast when visible is false', () => {
    render(<ToastNotification visible={false} changeState={changeStateMock} />);

    // Assert that the toast is not rendered when visible is false
    expect(screen.queryByText(/Check your email to Verify Account!!!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Welcome to Vera/i)).not.toBeInTheDocument();
  });

});
