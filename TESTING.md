# Unit Tests Documentation

This document provides comprehensive documentation for the unit tests in the Invoice Form project, including how to run tests, what they cover, and how to maintain them.

## Overview

The project uses **Vitest** as the testing framework with **@testing-library/react** for component testing. Tests are located in the `src/test/` directory and follow a structured approach to ensure comprehensive coverage of the invoice form functionality.

## Test Structure

```
src/test/
├── setup.ts                           # Test environment setup and mocks
├── components/
│   ├── InvoiceForm.test.tsx          # Invoice form component tests
│   └── invoice.test.ts               # Invoice module logic tests
```

## Running Tests

### Prerequisites

Ensure you have all dependencies installed:

```bash
npm install
```

### Running All Tests

```bash
npm run test
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

### Running Tests with Coverage

```bash
npm run test:coverage
```

### Running Specific Test Files

```bash
# Run only InvoiceForm component tests
npm run test -- InvoiceForm

# Run only invoice module tests
npm run test -- invoice.test.ts
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

The test configuration includes:

- **Environment**: `jsdom` for DOM testing
- **Setup Files**: `src/test/setup.ts` for global mocks and configuration
- **Coverage**: Configured to track coverage across source files
- **Globals**: Enables global test functions (describe, it, expect)

### Test Setup (`src/test/setup.ts`)

The setup file provides comprehensive mocks for:

- **Ionic React Components**: All IonModal, IonButton, IonInput, etc.
- **SocialCalc**: Spreadsheet engine with mock functions
- **Capacitor APIs**: File system, device, network APIs
- **React Router**: Navigation and routing
- **Browser APIs**: localStorage, sessionStorage, File, Blob, etc.

## Test Coverage

### InvoiceForm Component Tests (`InvoiceForm.test.tsx`)

#### Rendering Tests

- ✅ **Renders when open**: Verifies the modal displays when `isOpen={true}`
- ✅ **Does not render when closed**: Ensures modal is hidden when `isOpen={false}`
- ✅ **Displays all form fields**: Checks presence of required input fields

#### User Interaction Tests

- ✅ **Updates form fields when user types**: Validates input handling
- ✅ **Clears form data when clear button is clicked**: Tests form reset functionality
- ✅ **Adds invoice data when add button is clicked**: Verifies data submission
- ✅ **Closes modal when close button is clicked**: Tests modal dismissal

#### Validation Tests

- ✅ **Shows validation error for missing required fields**: Ensures form validation
- ✅ **Resets form when modal is opened**: Verifies clean state on open

#### Line Items Tests

- ✅ **Supports adding line items**: Tests dynamic item addition
- ✅ **Handles line item calculations**: Verifies amount calculations

### Invoice Module Tests (`invoice.test.ts`)

#### addInvoiceData Function Tests

- ✅ **Adds basic invoice information**: Tests header data insertion
- ✅ **Adds line items to sheet**: Verifies item array handling
- ✅ **Handles partial data gracefully**: Tests with incomplete data
- ✅ **Handles empty items array**: Edge case testing
- ✅ **Handles invalid input gracefully**: Null/undefined input testing

#### clearInvoiceData Function Tests

- ✅ **Clears all invoice data**: Verifies complete data removal
- ✅ **Handles empty sheet gracefully**: Edge case with no data
- ✅ **Preserves non-invoice data**: Ensures selective clearing

#### Integration Tests

- ✅ **Add and clear cycle**: Tests complete workflow
- ✅ **Multiple add operations**: Tests data overwriting behavior

## Test Patterns and Best Practices

### 1. Component Testing Pattern

```typescript
describe('ComponentName', () => {
  const defaultProps = {
    // Define default props
  };

  beforeEach(() => {
    // Reset mocks and state
    vi.clearAllMocks();
  });

  const renderWithProvider = (props = defaultProps) => {
    return render(
      <InvoiceProvider>
        <ComponentName {...props} />
      </InvoiceProvider>
    );
  };

  it('should do something', () => {
    // Test implementation
  });
});
```

### 2. User Interaction Testing

```typescript
it('updates form field when user types', async () => {
  renderWithProvider();

  const input = screen.getByPlaceholderText(/field name/i);

  fireEvent.change(input, {
    target: { value: 'test value' }
  });

  await waitFor(() => {
    expect(input).toHaveValue('test value');
  });
});
```

### 3. Mock Function Verification

```typescript
it('calls function with correct parameters', async () => {
  const mockFunction = vi.fn();

  // Trigger action
  fireEvent.click(button);

  await waitFor(() => {
    expect(mockFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedProperty: 'expectedValue',
      })
    );
  });
});
```

## Mock Documentation

### SocialCalc Mocks

The SocialCalc global object is mocked with:

```typescript
global.SocialCalc = {
  SpreadsheetControl: class MockSpreadsheetControl {
    // Mock spreadsheet control implementation
  },
  GetCellContents: vi.fn(),
  ParseSheetSave: vi.fn(),
  CreateSheetSave: vi.fn(),
  addInvoiceData: vi.fn(),
  clearInvoiceData: vi.fn(),
};
```

### Ionic Component Mocks

All Ionic components are mocked to render as standard HTML elements:

```typescript
IonModal: ({ children, isOpen, ...props }) =>
  isOpen ? React.createElement('div', { 'data-testid': 'ion-modal' }, children) : null
```

### Capacitor API Mocks

Device APIs are mocked for testing in web environment:

```typescript
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn(() => Promise.resolve()),
    readFile: vi.fn(() => Promise.resolve({ data: '' })),
    // ... other methods
  },
}));
```

## Adding New Tests

### 1. Component Tests

When adding new components, create a test file following the pattern:

```typescript
// src/test/components/NewComponent.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NewComponent from '../../components/NewComponent';

describe('NewComponent', () => {
  it('should render correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 2. Function/Module Tests

For utility functions or modules:

```typescript
// src/test/utils/utilFunction.test.ts
import { describe, it, expect } from 'vitest';
import { utilFunction } from '../../utils/utilFunction';

describe('utilFunction', () => {
  it('should return expected result', () => {
    const result = utilFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## Testing Guidelines

### Do's ✅

- **Test user behavior**, not implementation details
- **Use descriptive test names** that explain what is being tested
- **Group related tests** using `describe` blocks
- **Reset mocks** between tests using `beforeEach`
- **Use `waitFor`** for asynchronous operations
- **Test error conditions** and edge cases
- **Mock external dependencies** consistently

### Don'ts ❌

- **Don't test internal state** unless necessary
- **Don't test third-party libraries** functionality
- **Don't write overly complex tests** that are hard to understand
- **Don't forget to clean up** after tests
- **Don't hardcode values** that might change

## Debugging Tests

### 1. Debug Mode

Run tests with debugging information:

```bash
npm run test -- --reporter=verbose
```

### 2. Single Test Debugging

Focus on a specific test:

```typescript
it.only('should test specific behavior', () => {
  // Test implementation
});
```

### 3. Console Debugging

Use `screen.debug()` to see rendered output:

```typescript
it('should render something', () => {
  render(<Component />);
  screen.debug(); // Prints current DOM
  // Test assertions
});
```

### 4. Mock Debugging

Log mock calls for debugging:

```typescript
const mockFn = vi.fn();
// ... trigger action
console.log('Mock calls:', mockFn.mock.calls);
```

## Continuous Integration

Tests run automatically on:

- **Pull requests**: All tests must pass
- **Main branch pushes**: Full test suite execution
- **Release builds**: Tests + coverage reporting

### Coverage Requirements

Maintain minimum coverage levels:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

Ensure all dependencies are installed and imports are correct.

#### 2. "Document is not defined" errors

Check that `jsdom` environment is configured in vitest.config.ts.

#### 3. Mock not working

Verify mock is defined before component import and uses correct module path.

#### 4. Async test failures

Use `waitFor` for DOM updates and `await` for async operations.

### Getting Help

If you encounter issues:

1. Check the test output for specific error messages
2. Verify mock configurations in `setup.ts`
3. Review existing test patterns for reference
4. Check Vitest and Testing Library documentation

## Maintenance

### Regular Tasks

- **Review test coverage** monthly and add tests for uncovered code
- **Update mocks** when adding new dependencies
- **Refactor tests** when components change significantly
- **Document new testing patterns** in this guide

### Version Updates

When updating testing dependencies:

1. Update package.json versions
2. Test that existing tests still pass
3. Update mocks if APIs changed
4. Update this documentation if needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Ionic Testing Guide](https://ionicframework.com/docs/react/testing)
