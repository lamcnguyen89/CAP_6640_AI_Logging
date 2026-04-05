import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom'; // Import jest-dom for matchers like toBeInTheDocument
import Login from './Login';
import { login } from '../../helpers/AuthApiHelper';

// Mock the login API function
vi.mock('../../store/api', () => ({
  login: vi.fn(),
}));

// Mock grecaptcha
const mockGrecaptcha = {
  execute: vi.fn().mockResolvedValue('mocked-captcha-token'), // mock token
  ready: vi.fn().mockImplementation((callback) => callback()),
};

beforeAll(() => {
  window.grecaptcha = mockGrecaptcha; // Assign the mock to window.grecaptcha
});

describe('Login Component', () => {
  it('renders login form correctly', () => {
    render(<Login />);

    // Check if the form elements are rendered
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('●●●●●●●●')).toBeInTheDocument(); // Corrected placeholder text
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument(); // Specific button check
  });

  it('calls login function with correct data and recaptcha token', async () => {
    render(<Login />);

    // Simulate user input
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('●●●●●●●●'), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Ensure recaptcha ready and execute have been called
    expect(mockGrecaptcha.ready).toHaveBeenCalled();
    expect(mockGrecaptcha.execute).toHaveBeenCalledWith('6Lc4l2UqAAAAAD2Rzifl28ffROgI0ugpf9bClY3c', { action: 'login' });

    // Wait for the login function to be called with correct data
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'password123',
          captchaToken: 'mocked-captcha-token', // Mocked reCAPTCHA token
        },
        'mocked-captcha-token', // This is passed separately as well
        expect.any(Function) // onError callback
      );
    });
  });
});
