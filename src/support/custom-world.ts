import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page } from "@playwright/test";
import { PlaywrightHelper } from "./playwright-helper";
import { MailboxSyncRecordPage } from "@pages/mailbox-sync-record-page";
import { SalesforceHomePage } from "@pages/salesforce-home-page";
import { MailboxSyncHomePage } from "@pages/mailbox-sync-home-page";

export interface CucumberWorldConstructorParams extends IWorldOptions {
  parameters: { [key: string]: string };
}

/**
 * Global singletons reused across scenarios (if you choose reuse).
 * Start as undefined and get set during setup().
 */
let globalBrowser: Browser | undefined;
let globalContext: BrowserContext | undefined;
let globalPage: Page | undefined;
const globalPageObjects = new Map<string, unknown>(); // POM cache

export class CustomWorld extends World {
  // existing browser/context/page properties...
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // Add optional page-object holders (values only)
  proxySfHomePage?: SalesforceHomePage;
  //openMailboxSyncFromHome?: MailboxSyncHomePage;
  currentMailboxRecordPage?: MailboxSyncRecordPage;
  mailboxSyncHomePage?: MailboxSyncHomePage;

  // optional: store primitive shared values
  currentIxtnumber?: string;

  constructor(options: CucumberWorldConstructorParams) {
    super(options);
    // If globals already exist, adopt them; otherwise setup() will assign fresh ones.
    if (globalBrowser && globalContext && globalPage) {
      this.browser = globalBrowser;
      this.context = globalContext;
      this.page = globalPage;
    }
    // If any are missing, we leave them unassigned here; setup() will set them.
  }

  /**
   * Generic Page Object factory with caching across scenarios.
   * Creates once per class name and reuses.
   */
  getPageObject<T>(PageClass: new (page: Page) => T): T {
    const key = PageClass.name;
    if (!globalPageObjects.has(key)) {
      if (!this.page)
        throw new Error("Page not initialized. Call setup() first.");
      globalPageObjects.set(key, new PageClass(this.page));
    }
    return globalPageObjects.get(key) as T;
  }

  /**
   * Setup browser/context/page. Reuse globals if present; otherwise create.
   */
  async setup(
    browserName: string = process.env.BROWSER || "chromium"
  ): Promise<void> {
    if (!globalBrowser || !globalContext || !globalPage) {
      // Create fresh
      this.browser = await PlaywrightHelper.launchBrowser(browserName);
      this.context = await PlaywrightHelper.createContext(this.browser);
      this.page = await PlaywrightHelper.newPage(this.context);

      // Publish to globals for reuse
      globalBrowser = this.browser;
      globalContext = this.context;
      globalPage = this.page;
    } else {
      // Reuse
      this.browser = globalBrowser;
      this.context = globalContext;
      this.page = globalPage;
    }
  }

  /**
   * Per-scenario teardown if you want a clean slate each time.
   * (If you prefer reuse across scenarios, skip calling this in After.)
   */
  async teardown(): Promise<void> {
    await PlaywrightHelper.closeBrowser(); // closes browser/context/page safely
    globalBrowser = undefined;
    globalContext = undefined;
    globalPage = undefined;
    globalPageObjects.clear();
  }

  /**
   * Suite-end cleanup (call from AfterAll).
   */
  static async cleanupGlobalState(): Promise<void> {
    await PlaywrightHelper.closeBrowser();
    globalBrowser = undefined;
    globalContext = undefined;
    globalPage = undefined;
    globalPageObjects.clear();
  }
}

setWorldConstructor(CustomWorld);
