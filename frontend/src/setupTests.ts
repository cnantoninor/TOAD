// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Only include Jest-specific mocks in test environment
declare const jest: any;

if (typeof jest !== 'undefined') {
  // Mock scrollIntoView
  Element.prototype.scrollIntoView = jest.fn();

  // Mock URL methods for blob handling
  const mockCreateObjectURL = jest.fn().mockReturnValue('blob:mock-url');
  const mockRevokeObjectURL = jest.fn();

  Object.defineProperty(window, 'URL', {
    value: {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    },
    writable: true,
  });
}