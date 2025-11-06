import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";
import { SalesforceHomePage } from "./salesforce-home-page";
import { IxtWebFormHomePage } from "./ixt-webform-home-page";
import { MailboxSyncHomePage } from "./mailbox-sync-home-page";

/**
 * IXT Mailbox App Page
 * - Follows Salesforce Lightning App structure.
 * - Uses BasePage utilities (clickAppLauncher, clickAndWaitNavigation, etc.)
 */
export class IxtMailboxApp extends BasePage {
  private readonly searchAppBox: Locator;
  private readonly ixtMailboxWebForm: Locator;

  constructor(page: Page) {
    super(page);

    this.searchAppBox = this.page.getByLabel("Search apps and items...");
    this.ixtMailboxWebForm = this.page.locator(
      "p.slds-truncate:has-text('IXT Mailbox WebForm')"
    );
  }

  async searchAndSelectIxtWebForm(): Promise<IxtWebFormHomePage> {
    this.logInfo?.("Searching the IXT WebForm via app launcher");

    // open App Launcher - BasePage should have a reusable helper
    await this.clickAppLauncher();

    // type in search
    await this.searchAppBox.fill("IXT Mailbox WebForm");

    // wait for result and navigate
    await this.ixtMailboxWebForm.waitFor({ state: "visible" });

    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      this.ixtMailboxWebForm.click(),
    ]);

    this.logInfo?.("Navigated to IXT Mailbox WebForm");
    return new IxtWebFormHomePage(this.page);
  }

  /**
   * (Optional) Navigate to Mailbox Sync tab from within the IXT Mailbox App.
   */
  async clickMailboxSyncTab(): Promise<MailboxSyncHomePage> {
    const mailboxSyncTab = this.page.locator(
      "a[title='Immigration Mailbox Sync']"
    );
    await mailboxSyncTab.waitFor({ state: "visible" });
    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      mailboxSyncTab.click(),
    ]);
    return new MailboxSyncHomePage(this.page);
  }
}
