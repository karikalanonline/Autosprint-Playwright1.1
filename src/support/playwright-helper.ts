import { chromium, firefox, webkit, Browser, BrowserContext, Page, LaunchOptions } from '@playwright/test';
import config from '../config/config';

class PlaywrightHelper {
  private static browser: Browser;
  private static context: BrowserContext;
  public static page: Page;
    static async launchBrowser(browserName: string = 'chromium'): Promise<Browser> {
    // If browser already exists and is connected, return it
    if (this.browser && this.browser.isConnected()) {
      //console.log('Reusing existing browser instance');
      return this.browser;
    }
    
    //console.log(`Launching new ${browserName} browser`);
    const options: LaunchOptions = {
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      timeout: config.browser.timeout,
      args: ['--start-maximized'] // Add arguments to maximize the browser window
    };

    switch (browserName.toLowerCase()) {
      case 'firefox':
        this.browser = await firefox.launch(options);
        break;
      case 'webkit':
        this.browser = await webkit.launch(options);
        break;
      default:
        this.browser = await chromium.launch(options);
    }

    return this.browser;
  }
  static async createContext(browser: Browser): Promise<BrowserContext> {    this.context = await browser.newContext({
      viewport: null, // Set viewport to null to use the entire screen size
      recordVideo: {
        dir: 'reports/videos/',
        size: { width: 1920, height: 1080 }, // Set video recording to HD resolution
      },
      acceptDownloads: true
    });

    return this.context;
  }

  static async newPage(context: BrowserContext): Promise<Page> {
    this.page = await context.newPage();
    return this.page;
  }

  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

export { PlaywrightHelper };
