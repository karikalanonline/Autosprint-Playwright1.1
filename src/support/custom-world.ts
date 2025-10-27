import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page } from "@playwright/test";
import { PlaywrightHelper } from "./playwright-helper";
import config from "../config/config";

export interface CucumberWorldConstructorParams extends IWorldOptions {
  parameters: { [key: string]: string };
}

// Global variables to maintain state across scenarios
let globalBrowser: Browser | null = null;
let globalContext: BrowserContext | null = null;
let globalPage: Page | null = null;
let globalPageObjects: Map<string, any> = new Map(); // Cache for all page objects

export class CustomWorld extends World {
  browser!: Browser | null;
  context!: BrowserContext | null;
  page!: Page | null;

  constructor(options: CucumberWorldConstructorParams) {
    super(options);
    // Use global instances if they exist
    this.browser = globalBrowser;
    this.context = globalContext;
    this.page = globalPage;
  }

  // Generic page factory - works for ANY page class
  getPageObject<T>(PageClass: new (page: Page) => T): T {
    const className = PageClass.name;

    // Check if page object already exists in cache
    if (globalPageObjects.has(className)) {
      //console.log(`Reusing existing ${className} instance`);
      return globalPageObjects.get(className);
    }

    // Create new page object if it doesn't exist
    if (!this.page) {
      //console.error('Page is not initialized. Browser setup may have failed.');
      throw new Error(
        "Page is not initialized. Make sure the Before hook completed successfully."
      );
    }

    //console.log(`Creating new ${className} instance`);
    const pageObject = new PageClass(this.page);

    // Cache for reuse across scenarios
    globalPageObjects.set(className, pageObject);

    return pageObject;
  }

  async setup(
    browserName: string = process.env.BROWSER || "chromium"
  ): Promise<void> {
    try {
      //console.log(`Setting up browser: ${browserName}`);

      // Only create new instances if they don't exist globally
      if (!globalBrowser || !globalContext || !globalPage) {
        //console.log('Creating new browser instance...');
        this.browser = await PlaywrightHelper.launchBrowser(browserName);
        this.context = await PlaywrightHelper.createContext(this.browser);
        this.page = await PlaywrightHelper.newPage(this.context);

        // Store globally for reuse
        globalBrowser = this.browser;
        globalContext = this.context;
        globalPage = this.page;

        //console.log('Created new browser context for scenario flow');
      } else {
        // Reuse existing instances
        this.browser = globalBrowser;
        this.context = globalContext;
        this.page = globalPage;
        //console.log('Reusing existing browser context for scenario flow');
      }

      //console.log(`Browser setup completed successfully. Page ready: ${!!this.page}`);
    } catch (error: any) {
      //console.error(`Failed to set up browser: ${error.message || error}`);
      //console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    // Clear global instances and close browser
    globalBrowser = null;
    globalContext = null;
    globalPage = null;
    globalPageObjects.clear(); // Clear all cached page objects
    await PlaywrightHelper.closeBrowser();
  }

  // Static method to clean up all global state (called in AfterAll)
  static async cleanupGlobalState(): Promise<void> {
    globalBrowser = null;
    globalContext = null;
    globalPage = null;
    globalPageObjects.clear();
    await PlaywrightHelper.closeBrowser();
  }
}

setWorldConstructor(CustomWorld);
