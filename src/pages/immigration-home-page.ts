import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";
import { ImmigrationRecordPage } from "./immigration-record-page";

/**
 * Immigration Home page (Lightning list/table view).
 * - Keep selectors private and in the constructor
 * - No assertions here; return values/next pages. Do expect() in steps.
 */
export class ImmigrationHomePage extends BasePage {
  private readonly immigrationNameHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.immigrationNameHeader = this.page
      .locator("th[data-label='Immigration Name']")
      .first();
  }

  /**
   * Opens the first Immigration record by clicking the "Immigration Name" header cell
   * (matches your current Python logic).
   * Returns the record page object.
   */
  async openFirstImmigrationRecord(
    timeout = 5_000
  ): Promise<ImmigrationRecordPage> {
    await this.immigrationNameHeader.waitFor({ state: "visible", timeout });
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.immigrationNameHeader.click(),
    ]);
    return new ImmigrationRecordPage(this.page);
  }

  /**
   * (Optional) Open a specific record by its visible link text (record id/name).
   * Useful if you know the record id, e.g., "I-23357".
   */
  async openImmigrationRecordById(
    recordId: string,
    timeout = 30_000
  ): Promise<ImmigrationRecordPage> {
    const link = this.page.getByRole("link", { name: recordId }).first();
    await link.waitFor({ state: "visible", timeout });
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      link.click(),
    ]);
    return new ImmigrationRecordPage(this.page);
  }
}
