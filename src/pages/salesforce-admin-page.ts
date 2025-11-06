import { Page, Locator, FrameLocator } from "@playwright/test";
import { BasePage } from "./basePage";
import { SalesforceHomePage } from "./salesforce-home-page";
import { logger } from "../support/logger";

/**
 * Salesforce Setup → Admin page
 * - Proxies login as another user via Setup.
 * - Uses iframe("User: ...") section to click the Login button.
 * - No assertions inside; step files should assert outcomes.
 */
export class SalesforceAdminPage extends BasePage {
  // Locators
  private readonly userSearchBox: Locator;
  private readonly userResultByTitle = (username: string) =>
    this.page.locator(`span[title='${username}']`).first();
  private readonly userFrame: FrameLocator;
  private readonly loginButtonInFrame: Locator;
  private readonly sessionEndedText: Locator;
  private readonly sessionEndedLoginButton: Locator;

  constructor(page: Page) {
    super(page);

    this.userSearchBox = this.page.locator("input[title='Search Setup']");
    this.userFrame = this.page.frameLocator("iframe[title*='User:']");
    this.loginButtonInFrame = this.userFrame
      .locator("input[title='Login']")
      .first();

    this.sessionEndedText = this.page.locator("text=Your session has ended");
    this.sessionEndedLoginButton = this.page.locator(
      "button:has-text('Log In')"
    );
  }

  /**
   * Proxy login as a given username from the Setup → Users page.
   * Returns SalesforceHomePage after successful navigation.
   */
  async proxyLogin(username: string): Promise<SalesforceHomePage> {
    this.logInfo?.(`Proxy logging in as ${username}`);

    // Search the user in Setup global search
    await this.fillField("input[title='Search Setup']", username);

    // Click the user from results
    const userHit = this.userResultByTitle(username);
    await userHit.waitFor({ state: "visible" });
    await userHit.click();

    // Inside the user details iframe, click "Login"
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.loginButtonInFrame.click(),
    ]);

    // Handle "Your session has ended" modal if it appears
    const endedVisible = await this.sessionEndedText
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    if (endedVisible) {
      logger.warn("Session expired popup appeared - clicking Log In");
      await this.sessionEndedLoginButton.click();
    }

    // Optional settle; prefer explicit waits in caller when asserting post-login state
    await this.page.waitForLoadState("domcontentloaded").catch(() => {});

    // Debug traces (optional)
    logger.debug(`After proxy login, url=${this.page.url}`);
    try {
      const urls = this.page
        .context()
        .pages()
        .map((p) => p.url());
      logger.debug(`Open pages: ${JSON.stringify(urls)}`);
    } catch {}

    return new SalesforceHomePage(this.page);
  }
}
