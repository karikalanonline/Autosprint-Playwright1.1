import { Before, After, BeforeAll, AfterAll, Status } from "@cucumber/cucumber";
import { CustomWorld } from "./custom-world";
import { PlaywrightHelper } from "./playwright-helper";
import fs from "fs";
import path from "path";
import { setDefaultTimeout } from "@cucumber/cucumber";
setDefaultTimeout(60 * 1000);
// Create logs directory if it doesn't exist
BeforeAll(async function () {
  const logsDir = path.join(process.cwd(), "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const reportsDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const screenshotsDir = path.join(reportsDir, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const videosDir = path.join(reportsDir, "videos");
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  // Create or clear the test log
  fs.writeFileSync(path.join(logsDir, "test.log"), "", "utf8");

  //console.log('Test execution started');
  fs.appendFileSync(
    path.join(logsDir, "test.log"),
    `Test execution started at ${new Date().toISOString()}\n`,
    "utf8"
  );
});

Before({ timeout: 60000 }, async function (this: CustomWorld, scenario) {
  //console.log(`Running scenario: ${scenario.pickle.name}`);

  try {
    // Setup browser/context - will reuse if already exists
    const browserName = process.env.BROWSER || "chromium";
    await this.setup(browserName);

    // Verify that the page is actually initialized
    if (!this.page) {
      throw new Error("Browser setup failed - page is null after setup");
    }
    this.page.setDefaultTimeout(30000);
    this.page.setDefaultNavigationTimeout(45000);

    //console.log(`Browser setup verified for scenario: ${scenario.pickle.name}`);

    // Page objects will be created on-demand using getPageObject()
    // No need to pre-initialize any specific page objects

    // Log scenario start
    fs.appendFileSync(
      path.join(process.cwd(), "logs", "test.log"),
      `Scenario started: ${
        scenario.pickle.name
      } at ${new Date().toISOString()}\n`,
      "utf8"
    );
  } catch (error) {
    console.error(
      `Failed to setup browser for scenario: ${scenario.pickle.name}`,
      error
    );
    throw error;
  }
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && this.page) {
    try {
      // Take screenshot if scenario fails and page is initialized
      const screenshot = await this.page.screenshot({
        path: path.join(
          process.cwd(),
          "reports",
          "screenshots",
          `${scenario.pickle.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`
        ),
        type: "png",
        fullPage: true,
      });

      this.attach(screenshot, "image/png");
    } catch (error) {
      console.error("Failed to take screenshot:", error);
    }

    // Log the failure
    console.error(`Scenario failed: ${scenario.pickle.name}`);
    fs.appendFileSync(
      path.join(process.cwd(), "logs", "test.log"),
      `Scenario failed: ${
        scenario.pickle.name
      } at ${new Date().toISOString()}\n`,
      "utf8"
    );
  }

  // Keep context and page open for continuous flow
  // Only log scenario completion, don't close anything
  //console.log(`Scenario completed: ${scenario.pickle.name}`);
  fs.appendFileSync(
    path.join(process.cwd(), "logs", "test.log"),
    `Scenario completed: ${
      scenario.pickle.name
    } at ${new Date().toISOString()}\n`,
    "utf8"
  );
});

AfterAll(async function () {
  // Close the shared browser instance after all tests
  //console.log('Closing browser after all tests');
  await PlaywrightHelper.closeBrowser();

  //console.log('Test execution completed');
  fs.appendFileSync(
    path.join(process.cwd(), "logs", "test.log"),
    `Test execution completed at ${new Date().toISOString()}\n`,
    "utf8"
  );
});
