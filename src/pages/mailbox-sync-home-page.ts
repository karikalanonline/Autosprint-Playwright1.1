import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";
import { MailboxSyncRecordPage } from "./mailbox-sync-record-page";

export class MailboxSyncHomePage extends BasePage {
  // Locators
  //private globalSearchOpenButton: Locator;
  //private globalSearchInput: Locator;
  private readonly globalSearchButton: Locator;
  private readonly globalSearchBox: Locator;
  private readonly globalSearchInput: Locator;
  private readonly listSearchInput: Locator;
  private readonly picklistIcon: Locator;
  private readonly listSearchCombobox: Locator;
  private readonly imgRequestNumberCells: Locator;
  private readonly recordTypeLabel: Locator;

  constructor(page: Page) {
    super(page);

    this.globalSearchButton = this.page.locator("button[aria-label='Search']");
    this.globalSearchInput = this.page
      .locator("input.slds-input[placeholder='Search...'][type='search']")
      .first();
    this.globalSearchBox = this.page.getByRole("searchbox").first();
    this.listSearchInput = this.page
      .locator("input.slds-input[placeholder='Search...'][type='search']")
      .first();

    // this.globalSearchOpenButton = this.page
    //   .getByRole("button", { name: "Search" })
    //   .nth(0);
    // this.globalSearchInput = this.page
    //   .locator('input[type="search"][placeholder^="Search"]')
    //   .nth(0);
    this.picklistIcon = this.page.locator(
      "button[title='Select a List View: Immigration Mailbox Sync']"
    );
    this.listSearchCombobox = this.page.locator("input[role='combobox']");

    this.imgRequestNumberCells = this.page.locator(
      "th[data-label='IMG Request Number']"
    );
    this.recordTypeLabel = this.page.locator(
      "div div div span.test-id__field-label:has-text('Record Type')"
    );
  }

  // async openGlobalSearchAndOpenResult(query: string) {
  //   await this.globalSearchOpenButton.waitFor({
  //     state: "visible",
  //     timeout: 10_000,
  //   });
  //   await this.globalSearchOpenButton.waitFor({
  //     state: "visible",
  //     timeout: 15_000,
  //   });
  //   await this.globalSearchOpenButton.click();

  //   await this.globalSearchInput.waitFor({ state: "visible", timeout: 15_000 });

  //   await this.globalSearchInput.fill(query);
  //   const resultLink = this.page.getByRole("link", { name: query }).first();
  //   await resultLink.waitFor({ state: "visible", timeout: 15_000 });
  //   await Promise.all([
  //     await this.page.waitForLoadState("domcontentloaded"),
  //     await resultLink.click(),
  //   ]);

  //   return new MailboxSyncRecordPage(this.page);
  // }

  async selectIxtRecord(inquiryNumber: string): Promise<MailboxSyncRecordPage> {
    const link = this.page.locator(`a[title='${inquiryNumber}']`).first();
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded").catch(() => {}),
      link.click(),
    ]);
    return new MailboxSyncRecordPage(this.page);
  }

  async openIxtRecordBusiness(
    recordId: string,
    timeout = 30_000
  ): Promise<MailboxSyncRecordPage> {
    await this.page.pause();
    await this.globalSearchButton.waitFor({ state: "visible" });
    await this.globalSearchButton.click();
    await this.globalSearchInput.waitFor({ state: "visible", timeout: 15_000 });
    await this.globalSearchInput.fill("");
    await this.globalSearchInput.fill(recordId);
    //await this.globalSearchInput.press("Enter");

    const result = this.page
      .locator(`mark.data-match:has-text("${recordId}")`)
      .first();
    await result.waitFor({ state: "visible", timeout });

    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      result.click(),
    ]);

    await this.page
      .waitForURL(/\/lightning\/r\/.*\/.*\/view/, { timeout: 20000 })
      .catch(() => {});
    return new MailboxSyncRecordPage(this.page);
  }

  async goToListView(listViewName: string): Promise<this> {
    await this.picklistIcon.click();
    await this.listSearchCombobox.click();
    // Prefer type() when you want key events to fire (matches your Python .type)
    await this.type("input[role='combobox']", listViewName);

    const listViewItem = this.page
      .locator(
        `div.slds-listbox lightning-base-combobox-formatted-text:has-text("${listViewName}")`
      )
      .first();

    await listViewItem.waitFor({ state: "visible" });
    await listViewItem.click();
    return this;
  }

  async isListViewLoaded(
    listViewName: string,
    timeout = 10_000
  ): Promise<boolean> {
    const header = this.page.locator(
      `span.slds-page-header__title:has-text("${listViewName}")`
    );
    try {
      await header.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Open the first N records in the list, read “Record Type” for each,
   * then navigate back. Returns the collected record types.
   */
  async openFirstNRecords(n = 2): Promise<string[]> {
    const total = await this.imgRequestNumberCells.count();
    const take = Math.min(n, total);
    const types: string[] = [];

    for (let i = 0; i < take; i++) {
      const linkCell = this.imgRequestNumberCells.nth(i);
      await linkCell.scrollIntoViewIfNeeded();
      await linkCell.click();

      await this.page.waitForLoadState("domcontentloaded");
      await this.recordTypeLabel.scrollIntoViewIfNeeded();

      const value = await this.getFieldValueByLabel("Record Type");
      types.push(value);

      await Promise.all([
        this.page.waitForLoadState("domcontentloaded"),
        this.page.goBack(),
      ]);
    }
    return types;
  }

  /** Generic Lightning field reader by label text, returns the value’s visible text. */
  private async getFieldValueByLabel(label: string): Promise<string> {
    // Try common Lightning structure first:
    const container = this.page
      .locator(
        `div.slds-form-element:has(span.test-id__field-label:has-text("${label}"))`
      )
      .first();

    await container
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => {});

    // Look for common “value” nodes inside the container:
    const valueNode = container
      .locator(
        "lightning-formatted-text, .test-id__field-value, .slds-form-element__static"
      )
      .first();

    const txt = (
      await valueNode
        .innerText()
        .catch(async () => (await valueNode.textContent()) ?? "")
    )
      ?.toString()
      .trim();

    if (txt) return txt;

    // Fallback: generic label/value scan by XPath for edge layouts:
    const fallback = this.page
      .locator(
        `xpath=//span[contains(@class,'test-id__field-label') and normalize-space()="${label}"]
             /ancestor::div[contains(@class,'slds-form-element')][1]
             //span[contains(@class,'test-id__field-value') or contains(@class,'slds-form-element__static')]`
      )
      .first();

    const txt2 = (
      await fallback
        .innerText()
        .catch(async () => (await fallback.textContent()) ?? "")
    )
      ?.toString()
      .trim();

    return txt2 ?? "";
  }
}
