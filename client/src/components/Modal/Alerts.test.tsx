import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for matchers like toBeInTheDocument
import { describe, it, expect } from 'vitest'; // Use Vitest functions
import Alerts from './Alerts'; // Adjust path as needed

describe('Alerts Component', () => {
  it('renders the alert with the provided text and heading', () => {
    render(
      <Alerts
        showAlert={true}
        text="This is a test alert"
        heading="Test Alert"
        variant="danger"
        classname="custom-alert"
      />
    );

    // Check if the heading is rendered correctly
    expect(screen.getByText('Test Alert')).toBeInTheDocument();

    // Check if the alert text is rendered correctly
    expect(screen.getByText('This is a test alert')).toBeInTheDocument();

    // Check if the alert has the correct variant class
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');

    // Check if the custom class is applied
    expect(screen.getByRole('alert')).toHaveClass('custom-alert');
  });

  it('renders the alert without heading when heading is not provided', () => {
    render(
      <Alerts
        showAlert={true}
        text="This is a test alert without heading"
        variant="warning"
      />
    );

    // Check that the heading is not present
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    // Check if the alert text is rendered correctly
    expect(screen.getByText('This is a test alert without heading')).toBeInTheDocument();
  });

  it('does not render the alert when showAlert is false', () => {
    render(
      <Alerts
        showAlert={false}
        text="This alert should not be visible"
        variant="success"
      />
    );

    // Check that the alert is not present
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
