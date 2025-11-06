import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";

export interface IxtFormData {
  requestor_type: string;
  category: string;
  subcategory_1: string;
  permiso_online_assessment?: string;
  country_of_travel_1?: string;
  country_of_travel_2?: string;
  country_of_travel_3?: string;
  upcoming_travel_start_formatted?: string; // e.g., "2025-11-04"
  upcoming_travel_end_formatted?: string; // e.g., "2025-11-10"
  inquiry_text?: string; // default "Playwright Automation"
}

export class IxtWebFormHomePage extends BasePage {
  // Core widgets
  private readonly dropdownBtn: Locator;
  private readonly inquiryTextbox: Locator;
  private readonly submitButton: Locator;
  private readonly yesButton: Locator;
  private readonly thankyouMessage: Locator;
  private readonly confirmModal: Locator;
  private readonly startDate: Locator;
  private readonly endDate: Locator;

  // Dynamic helper finders
  private nameBadge(name: string): Locator {
    return this.page.locator("h2.slds-card__header-title span.slds-truncate", {
      hasText: name,
    });
  }
  private emailBadge(email: string): Locator {
    return this.page.locator("div.slds-var-p-horizontal_medium i a", {
      hasText: email,
    });
  }

  constructor(page: Page) {
    super(page);
    this.dropdownBtn = this.page.locator("button[role='combobox']");
    this.inquiryTextbox = this.page.locator(
      "div[class*='slds-rich-text-area']"
    );
    this.submitButton = this.page.locator(
      "button.slds-button.slds-button_brand:has-text('Submit')"
    );
    this.yesButton = this.page.locator(
      "button.slds-button.slds-button_brand:has-text('Yes')"
    );
    this.thankyouMessage = this.page.locator("p.slds-p-left_small");
    this.confirmModal = this.page.locator("div.slds-modal__container");
    this.startDate = this.page.locator("input[name='travelStartDate']");
    this.endDate = this.page.locator("input[name='travelEndDate']");
  }

  /** ---- Read helpers (for use in steps) ---- */

  async isNameVisible(
    expectedName: string,
    timeout = 10_000
  ): Promise<boolean> {
    try {
      await this.nameBadge(expectedName).waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  async isEmailVisible(
    expectedEmail: string,
    timeout = 10_000
  ): Promise<boolean> {
    try {
      await this.emailBadge(expectedEmail).waitFor({
        state: "visible",
        timeout,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getSuccessMessage(timeout = 15_000): Promise<string> {
    await this.thankyouMessage.waitFor({ state: "visible", timeout });
    const msg = (await this.thankyouMessage.innerText()).trim();
    return msg;
  }

  /**
   * Extract IXT inquiry number like "IXT-12345" from a success message.
   * Returns null if not found.
   */
  extractInquiryNumber(message: string): string | null {
    const m = message.match(/\b(IXT-\d+)\b/);
    return m ? m[1] : null;
  }

  /** ---- Actions ---- */

  /**
   * Open a dropdown by its accessible name (aria-label).
   * Ex: await openDropdown("Requestor Type")
   */
  async openDropdown(ariaLabel: string, timeout = 5_000): Promise<this> {
    const combo = this.page.getByRole("combobox", { name: ariaLabel }).first();
    await combo.scrollIntoViewIfNeeded();
    await combo.waitFor({ state: "visible", timeout });
    await combo.click();
    return this;
  }

  /**
   * For country list or other role=listbox controls (if needed separately).
   */
  async clickCountryDropdown(
    ariaLabel: string,
    timeout = 10_000
  ): Promise<this> {
    const listbox = this.page.getByRole("listbox", { name: ariaLabel });
    await listbox.waitFor({ state: "visible", timeout });
    await listbox.click();
    return this;
  }

  async selectOption(option: string, timeout = 5_000): Promise<this> {
    const opt = this.page.getByRole("option", { name: option });
    await opt.waitFor({ state: "visible", timeout });
    await opt.click();
    return this;
  }

  /**
   * Lightning-friendly date setter: sets value + dispatches input/change, then tabs out and verifies.
   */
  async setDateField(
    inputSelector: string,
    dateStr: string,
    timeout = 5_000
  ): Promise<string> {
    const field = this.page.locator(inputSelector).first();
    if ((await field.count()) === 0)
      throw new Error(`Date locator not found: ${inputSelector}`);

    await field.scrollIntoViewIfNeeded();
    await field.waitFor({ state: "visible", timeout });

    await field.evaluate((el, v) => {
      (el as HTMLInputElement).value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, dateStr);

    await field.press("Tab");
    const actual = (await field.inputValue()).trim();
    if (!actual)
      throw new Error(`Date not applied (empty) for ${inputSelector}`);
    return actual;
  }

  async setTravelStartDate(dateStr: string): Promise<this> {
    await this.setDateField("input[name='travelStartDate']", dateStr);
    return this;
  }

  async setTravelEndDate(dateStr: string): Promise<this> {
    await this.setDateField("input[name='travelEndDate']", dateStr);
    return this;
  }

  async enterInquiry(text = "Playwright Automation"): Promise<this> {
    await this.inquiryTextbox.scrollIntoViewIfNeeded();
    await this.inquiryTextbox.click();
    // assuming BasePage has `fill(selector, value)` helper; else use locator.fill
    await this.fillField("div[class*='slds-rich-text-area']", text);
    return this;
  }

  async clickSubmit(): Promise<this> {
    await this.submitButton.scrollIntoViewIfNeeded();
    // assuming BasePage has `click_element(selector)` helper; else use locator.click
    await this.clickElement(
      "button.slds-button.slds-button_brand:has-text('Submit')"
    );
    return this;
  }

  async confirmYes(timeout = 10_000): Promise<this> {
    await this.confirmModal.waitFor({ state: "visible", timeout });
    await this.clickElement(
      "button.slds-button.slds-button_brand:has-text('Yes')"
    );
    await this.confirmModal.waitFor({ state: "hidden", timeout });
    return this;
  }

  async goBackToSalesforce(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.page.goBack(),
    ]);
  }

  /**
   * High-level form flow (no assertions): fills and submits, then returns the IXT number.
   * This mirrors your Python `fill_form`, but avoids asserts and prints.
   */
  async fillForm(data: IxtFormData): Promise<string> {
    // Name/email presence checks should be done in steps via isNameVisible/isEmailVisible if needed.

    await this.openDropdown("Requestor Type");
    await this.selectOption(data.requestor_type);

    await this.openDropdown("Category");
    await this.selectOption(data.category);

    await this.openDropdown("Subcategory 1");
    await this.selectOption(data.subcategory_1);

    if (data.permiso_online_assessment) {
      await this.openDropdown("Permiso Online Assessment");
      await this.selectOption(data.permiso_online_assessment);
    }

    if (data.country_of_travel_1) {
      await this.openDropdown("Country of Travel 1");
      await this.selectOption(data.country_of_travel_1);
    }
    if (data.country_of_travel_2) {
      await this.openDropdown("Country of Travel 2");
      await this.selectOption(data.country_of_travel_2);
    }
    if (data.country_of_travel_3) {
      await this.openDropdown("Country of Travel 3");
      await this.selectOption(data.country_of_travel_3);
    }

    if (data.upcoming_travel_start_formatted) {
      await this.setTravelStartDate(data.upcoming_travel_start_formatted);
    }
    if (data.upcoming_travel_end_formatted) {
      await this.setTravelEndDate(data.upcoming_travel_end_formatted);
    }

    await this.enterInquiry(data.inquiry_text ?? "Playwright Automation");
    await this.clickSubmit();
    await this.confirmYes();

    const msg = await this.getSuccessMessage();
    const inquiryNumber = this.extractInquiryNumber(msg);
    if (!inquiryNumber)
      throw new Error("Inquiry number not present in success message");
    return inquiryNumber;
  }
}
