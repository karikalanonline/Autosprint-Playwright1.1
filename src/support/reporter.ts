import reporter from 'cucumber-html-reporter';
import fs from 'fs';
import path from 'path';

class Reporter {
  static generateReport(): void {
    try {
      // Generate HTML report
      const options: reporter.Options = {
        theme: 'bootstrap',
        jsonFile: path.join(process.cwd(), 'reports', 'cucumber-report.json'),
        output: path.join(process.cwd(), 'reports', 'cucumber-html-report.html'),
        reportSuiteAsScenarios: true,
        scenarioTimestamp: true,
        launchReport: false,
        metadata: {
          'App Version': '1.0.0',
          'Test Environment': process.env.NODE_ENV || 'development',
          'Browser': process.env.BROWSER || 'Chrome',
          'Platform': process.platform,
          'Executed': 'Local'
        },
        brandTitle: 'Playwright Cucumber Tests Report'
      };

      reporter.generate(options);
      //console.log('HTML Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
    }
  }
}

export { Reporter };
