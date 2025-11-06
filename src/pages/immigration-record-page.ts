import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";

/**
 * Immigration Record page (Lightning Record View)
 * - All locators private & initialized in constructor.
 * - No assertions; returns data for steps to validate.
 */
export class ImmigrationRecordPage extends BasePage {
  // Locators
  private readonly capNomineeFieldLabel: Locator;
  private readonly initiationPeriodLabel: Locator;
  private readonly capNomineeContainer: Locator;

  constructor(page: Page) {
    super(page);

    this.capNomineeFieldLabel = this.page.locator(
      "div div div span.test-id__field-label:has-text('CAP Nominee')"
    );

    this.initiationPeriodLabel = this.page.locator(
      "div.test-id__field-label-container.slds-form-element__label:has-text('Initiation Period (CI)')"
    );

    this.capNomineeContainer = this.page
      .locator(
        "[data-target-selection-name='sfdc:RecordField.WCT_Immigration__c.CAP_Nominee__c']"
      )
      .first();
  }

  /**
   * Wait until CAP Nominee field container is visible.
   */
  async waitForCapNomineeVisible(timeout = 30_000): Promise<this> {
    await this.capNomineeContainer.waitFor({ state: "visible", timeout });
    return this;
  }

  /**
   * Return the text value of the CAP Nominee field.
   * (Playwright auto-waits for the element.)
   */
  async getCapNomineeValue(timeout = 30_000): Promise<string> {
    await this.waitForCapNomineeVisible(timeout);

    const valueNode = this.capNomineeContainer
      .locator(
        "lightning-formatted-text, .test-id__field-value, .slds-form-element__static"
      )
      .first();

    const value = (await valueNode.innerText()).trim();
    return value;
  }

  /**
   * Optional: Check if Initiation Period field label exists on page.
   */
  async isInitiationPeriodVisible(timeout = 10_000): Promise<boolean> {
    try {
      await this.initiationPeriodLabel.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }
}
