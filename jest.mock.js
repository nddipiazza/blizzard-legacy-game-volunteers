// Mock for React 18 createRoot to use legacy rendering
jest.mock('react-dom/client', () => ({
  createRoot: (container) => ({
    render: (element) => {
      // Use the legacy render method instead
      require('react-dom').render(element, container);
    },
    unmount: () => {
      require('react-dom').unmountComponentAtNode(container);
    }
  })
}));

// Other necessary mocks for testing
