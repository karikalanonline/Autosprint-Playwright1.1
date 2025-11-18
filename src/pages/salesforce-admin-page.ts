import { Page, Locator, FrameLocator } from "@playwright/test";
import { BasePage } from "./basePage";
import { SalesforceHomePage } from "./salesforce-home-page";
import { logger } from "../support/logger";
import { CustomWorld } from "@support/custom-world";

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

  // async proxyLogin(username: string): Promise<SalesforceHomePage> {
  //   this.logInfo?.(`Proxy logging in as ${username}`);
  //   await this.page.waitForLoadState("domcontentloaded");
  //   await this.fill("input[title='Search Setup']", username);

  //   const userHit = this.userResultByTitle(username);
  //   await userHit.waitFor({ state: "visible" });
  //   await userHit.click();

  //   await Promise.all([
  //     this.page.waitForLoadState("domcontentloaded"),
  //     (async () => {
  //       await this.loginButtonInFrame.waitFor({
  //         state: "attached",
  //         timeout: 8_000,
  //       });
  //       this.loginButtonInFrame.click();
  //     })(),
  //   ]);
  //   const endedVisible = await this.sessionEndedText
  //     .isVisible({ timeout: 5_000 })
  //     .catch(() => false);
  //   if (endedVisible) {
  //     logger.warn("Session expired popup appeared - clicking Log In");
  //     await this.sessionEndedLoginButton.click();
  //   }

  //   // Optional settle; prefer explicit waits in caller when asserting post-login state
  //   await this.page.waitForLoadState("domcontentloaded").catch(() => {});

  //   // Debug traces (optional)
  //   logger.debug(`After proxy login, url=${this.page.url}`);
  //   try {
  //     const urls = this.page
  //       .context()
  //       .pages()
  //       .map((p) => p.url());
  //     logger.debug(`Open pages: ${JSON.stringify(urls)}`);
  //   } catch {}

  //   return new SalesforceHomePage(this.page);
  // }

  async proxyLogin(username: string): Promise<SalesforceHomePage> {
    this.logInfo?.(`Proxy logging in as ${username}`);
    await this.page.waitForLoadState("domcontentloaded");
    await this.userSearchBox.type(username, { delay: 50 });
    const hit = this.userResultByTitle(username);
    await hit.waitFor({ state: "visible", timeout: 8000 });
    await hit.click();

    // Prepare to catch a new page if login opens one.
    const newPagePromise = this.page
      .context()
      .waitForEvent("page")
      .catch(() => undefined);

    await this.loginButtonInFrame.waitFor({ state: "attached", timeout: 8000 });
    await this.loginButtonInFrame.click();

    // If a new page opened, use it; otherwise continue with the admin page's context page.
    const newPage = await Promise.race([
      newPagePromise,
      Promise.resolve(undefined),
    ]);
    const resultPage = newPage ?? this.page;

    // stabilize
    await resultPage.waitForLoadState("domcontentloaded").catch(() => {});

    // handle session-expired popup if present on the resultPage (optional)
    const sessionPopup = resultPage.locator("text=Your session has ended");
    if (await sessionPopup.isVisible().catch(() => false)) {
      const loginBtn = resultPage.locator("button:has-text('Log In')").first();
      await loginBtn.click().catch(() => {});
      await resultPage.waitForLoadState("domcontentloaded").catch(() => {});
    }

    return new SalesforceHomePage(resultPage);
  }
}
