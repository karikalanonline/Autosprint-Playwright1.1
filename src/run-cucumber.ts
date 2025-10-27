import { execSync } from 'child_process';
import { Reporter } from './support/reporter';
import minimist from 'minimist';
import fs from 'fs';
import path from 'path';
import config from './config/config';

// Parse command line arguments
const argv = minimist(process.argv.slice(2));
const tags = argv.tags ? `--tags "${argv.tags}"` : '';
const feature = argv.feature || '';
const browser = argv.browser || 'chromium';
const headless = argv.headless !== 'false' ? 'true' : 'false';

// Environment variables for the test
process.env.BROWSER = browser;
process.env.HEADLESS = headless;

try {
  // Create directories if they don't exist
  ['logs', 'reports', 'reports/screenshots', 'reports/videos'].forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
    
  // Display test configuration
  console.log('=== Test Run Information ===');
  console.log(`Browser: ${browser}`);
  console.log(`Headless Mode: ${config.browser.headless}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log('===========================');
  
  // This script is now only used for configuration and setup
  // Do not execute the cucumber command directly from here
  // Instead, register event handlers and setup hooks
  
  // Generate the report after tests complete
  process.on('exit', () => {
    try {
      Reporter.generateReport();
      console.log('\nTest execution completed successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  });
  
} catch (error) {
  console.error('\nTest execution failed with error:', error);
  
  // Still try to generate the report
  try {
    Reporter.generateReport();
  } catch (reportError) {
    console.error('Failed to generate report:', reportError);
  }

  // Print troubleshooting information
  console.error('\n=== Troubleshooting Tips ===');
  console.error('1. Check if the URL is accessible: ' + (process.env.BASE_URL || 'https://sperformanceiq.deloitte.com'));
  console.error('2. Verify your network connection');
  console.error('3. Check if the application is behind authentication that needs to be handled');
  console.error('4. Try running with UI mode to see what\'s happening: npm run test:ui');
  console.error('5. Check if the locators in the page objects match the actual application\'s HTML');
  console.error('===========================\n');
  
  process.exit(1);
}
