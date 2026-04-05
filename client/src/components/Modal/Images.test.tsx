import React from 'react';
import { render, screen } from '@testing-library/react';
import Images from './Images'; // Adjust the path as necessary

describe('Images Component', () => {
  test('renders the image with the provided source', () => {
    render(<Images src="test-image.jpg" />);

    // Check if the image is rendered with the correct source
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveAttribute('src', 'test-image.jpg');
  });

  test('applies fluid class when fluid prop is true', () => {
    render(<Images src="test-image.jpg" fluid={true} />);

    // Check if the image has the "img-fluid" class applied
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveClass('img-fluid');
  });

  test('applies rounded class when rounded prop is true', () => {
    render(<Images src="test-image.jpg" rounded={true} />);

    // Check if the image has the "rounded" class applied
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveClass('rounded');
  });

  test('applies custom class when classname prop is provided', () => {
    render(<Images src="test-image.jpg" classname="custom-class" />);

    // Check if the image has the custom class applied
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveClass('custom-class');
  });

  test('applies thumbnail class when thumbnail prop is true', () => {
    render(<Images src="test-image.jpg" thumbnail={true} />);

    // Check if the image has the "img-thumbnail" class applied
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveClass('img-thumbnail');
  });

  test('applies roundedCircle class when circle prop is true', () => {
    render(<Images src="test-image.jpg" circle={true} />);

    // Check if the image has the "rounded-circle" class applied
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveClass('rounded-circle');
  });

  test('handles multiple props correctly', () => {
    render(
      <Images
        src="test-image.jpg"
        fluid={true}
        rounded={true}
        thumbnail={true}
        circle={true}
        classname="custom-class"
      />
    );

    // Check if all classes are applied correctly
    const imgElement = screen.getByRole('img');
    expect(imgElement).toHaveClass(
      'img-fluid',
      'rounded',
      'img-thumbnail',
      'rounded-circle',
      'custom-class'
    );
  });
});
