// vitest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock MutationObserver in your test file or setup file
global.MutationObserver = class {
  constructor(callback) {}
  disconnect() {}
  observe(element, initObject) {}
  takeRecords() { return []; }
};

const originalError = console.error;

vi.spyOn(console, 'error').mockImplementation((message, ...args) => {
  if (typeof message === 'string' && message.includes('Warning: findDOMNode is deprecated')) {
    return; // Ignore the specific warning
  }

  // Call the original console.error with the message and other arguments
  originalError(message, ...args);
});
