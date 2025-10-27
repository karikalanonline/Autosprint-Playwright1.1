# Playwright Cucumber TypeScript Framework

A comprehensive test automation framework using Playwright, Cucumber, and TypeScript.

## Directory Structure

```
├── features/              # Cucumber feature files
├── logs/                  # Test execution logs
├── pages/                 # Page Object Model classes
├── reports/               # Test reports and screenshots
│   ├── screenshots/       # Captured screenshots
│   └── videos/            # Recorded videos
├── step_definitions/      # Cucumber step definitions
└── support/               # Support files for hooks, world, helpers
```

## Features

- **Page Object Model**: Separation of test logic and page interactions
- **Cucumber BDD**: Write tests in a human-readable format
- **TypeScript**: Type-safe code with better intellisense
- **Cross-browser Testing**: Run tests on Chromium, Firefox, and WebKit
- **Comprehensive Reporting**: HTML reports with screenshots and logs
- **Parallel Execution**: Run tests in parallel for faster execution
- **Video Recording**: Record video of test execution for better debugging
- **Screenshot Capture**: Capture screenshots on test failures

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running Tests

Run all tests:

```bash
npm test
```

Run specific feature file:

```bash
npm run test:feature -- login
```

Run tests with tags:

```bash
npm run test:smoke
npm run test:regression
```

Run tests on specific browsers:

```bash
npm run test:chrome
npm run test:firefox
npm run test:webkit
```

Run tests in non-headless mode:

```bash
npm run test:ui
```

### Reports

After test execution, reports are available in:

- HTML Report: `reports/cucumber-html-report.html`
- JSON Report: `reports/cucumber-report.json`
- Screenshots: `reports/screenshots/`
- Videos: `reports/videos/`
- Logs: `logs/test.log`

## Adding New Tests

1. Create a feature file in `features/` directory
2. Implement step definitions in `step_definitions/` directory
3. Create page objects in `pages/` directory

## Configuration

- `cucumber.js`: Cucumber configuration
- `playwright.config.ts`: Playwright configuration
- `tsconfig.json`: TypeScript configuration

## License

ISC
