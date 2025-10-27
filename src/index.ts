/**
 * Main entry point for the Playwright test framework
 * This file exports the necessary components for running tests
 */

// Export pages
export * from './pages/basePage';

// Export support utilities
export * from './support/playwright-helper';
export * from './support/custom-world';
export * from './support/hooks';
export * from './support/reporter';

// Main function if this file is executed directly
if (require.main === module) {
  console.log('Playwright Test Framework - Use npm scripts to run tests');
}
