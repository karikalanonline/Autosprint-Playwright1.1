import { Page, Locator, Selectors } from "@playwright/test";
import { BasePage } from "./basePage";
import { ImmigrationHomePage } from "./immigration-home-page";
import { SalesforceAdminPage } from "./salesforce-admin-page";
import { MailboxSyncHomePage } from "./mailbox-sync-home-page";
import { IxtMailboxApp } from "./ixt-mailbox-home-page";
import { IxtWebFormHomePage } from "./ixt-webform-home-page";

/**
 * Salesforce Home / Lightning landing page.
 * NOTE:
 *  - Keep selectors private.
 *  - No expect() calls here; return booleans or next page objects.
 *  - Prefer chainable `Promise<this>` where the page doesn't change.
 */
export class SalesforceHomePage extends BasePage {
  // private locators
  private readonly spinner: Locator;
  private readonly homeTab: Locator;
  private readonly accountTab: Locator;
  private readonly switchToLightningLink: Locator;
  private readonly immigration: Locator;
  private readonly ixtMailboxApp: Locator;
  private readonly ixtWebForm: Locator;
  private readonly gearIcon: Locator;
  private readonly setupOption: Locator;
  private readonly mailboxSyncTab: Locator;
  private readonly appSearchBox: Locator;

  constructor(page: Page) {
    super(page);

    // initialize all locators here (your preferred style)
    this.spinner = this.page.locator(".slds-spinner:not([hidden])");
    this.homeTab = this.page.locator("a[title='Home']");
    this.accountTab = this.page.locator(
      "a[href='/lightning/o/Account/home'] span.slds-truncate:has-text('Accounts')"
    );

    this.immigration = this.page.locator("a[data-label='Immigration']");
    this.ixtMailboxApp = this.page.locator(
      "p.slds-truncate:has-text('IXT Mailbox App')"
    );
    this.gearIcon = this.page.locator("div.setupGear");
    this.switchToLightningLink = this.page
      .locator("div.navLinks div.linkElements a.switch-to-lightning")
      .first();
    this.setupOption = this.page.locator("#related_setup_app_home");
    this.mailboxSyncTab = this.page.locator(
      "a[title='Immigration Mailbox Sync']"
    );
    this.appSearchBox = this.page.getByLabel("Search apps and items...");
    this.ixtWebForm = this.page.locator(
      "p.slds-truncate:has-text('IXT Mailbox WebForm')"
    );
  }

  /** Optional utility if your BasePage doesn't already have one */
  private async waitForSpinnerToDisappear(timeout = 10_000): Promise<void> {
    await this.spinner
      .waitFor({ state: "detached", timeout })
      .catch(() => void 0);
  }

  async isHomeTabVisible(): Promise<boolean> {
    try {
      const isVisible = await this.homeTab.isVisible();
      this.logInfo("HomeTab is successfully displayed");
      return isVisible;
    } catch (error) {
      this.logError(`Failed to check dashboard visibility: ${error}`);
      throw error;
    }
  }

  async searchImmigration(): Promise<this> {
    await this.appSearchBox.fill("Immigration");
    await this.immigration.waitFor({ state: "visible" });
    return this;
  }

  async searchAndSelectIxtMailboxApp(): Promise<IxtMailboxApp> {
    await this.appSearchBox.fill("IXT Mailbox App");
    await this.ixtMailboxApp.waitFor({ state: "visible" });

    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      this.ixtMailboxApp.click(),
    ]);

    await this.waitForSpinnerToDisappear();
    return new IxtMailboxApp(this.page);
  }

  async searchAndSelectIxtWebForm(): Promise<IxtWebFormHomePage> {
    await this.appSearchBox.type("IXT Mailbox Webform");
    await this.ixtWebForm.waitFor({ state: "visible" });

    await Promise.all([
      //this.page.waitForLoadState("domcontentloaded"),
      this.page.waitForTimeout(5000),
      this.ixtWebForm.click(),
    ]);

    //await this.waitForSpinnerToDisappear();
    return new IxtWebFormHomePage(this.page);
  }

  async clickImmigration(): Promise<ImmigrationHomePage> {
    await this.immigration.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.waitForSpinnerToDisappear();
    return new ImmigrationHomePage(this.page);
  }

  async switchToLightning(): Promise<this> {
    try {
      await this.switchToLightningLink.waitFor({
        state: "visible",
        timeout: 10_000,
      });
      await Promise.all([
        //this.page.waitForLoadState("domcontentloaded"),
        this.switchToLightningLink.click(),
      ]);
      await this.page.waitForLoadState("domcontentloaded");
      this.logInfo?.("Switched to Lightning");
    } catch {
      this.logInfo?.("Already in Lightning (no switch link visible)");
    }
    return this;
  }

  async goToAdminPage(): Promise<SalesforceAdminPage> {
    await this.gearIcon.click();

    const [setupPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.setupOption.click(),
    ]);

    await setupPage.waitForLoadState("domcontentloaded");
    return new SalesforceAdminPage(setupPage);
  }

  async clickMailboxSyncTab(): Promise<MailboxSyncHomePage> {
    await this.mailboxSyncTab.waitFor({ state: "visible" });
    //await this.mailboxSyncTab.click();

    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.mailboxSyncTab.click(),
    ]);

    await this.waitForSpinnerToDisappear();
    return new MailboxSyncHomePage(this.page);
  }
}
