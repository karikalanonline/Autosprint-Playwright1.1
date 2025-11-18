import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";
import path from "path";
import { promises as fs } from "fs";

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

  // A container that only exists on the success view
  private get successCard() {
    return this.page
      .locator("article.slds-card")
      .filter({ hasText: "Your inquiry number is" });
  }

  private get successMessageContainer() {
    return this.page.locator("p.slds-p-left_small");
  }

  private get inquiryNumberBold() {
    return this.page.locator("b", { hasText: "IXT-" });
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

  public async openDropdown(ariaLabel: string, timeout = 5_000): Promise<this> {
    const alias: Record<string, string> = {
      "I'm submitting on behalf of": "Requestor Type",
      "I’m submitting on behalf of": "Requestor Type",
      "I have a question about": "Category",
      "Tell us more": "Subcategory 1",
      "Have you previously been employed as a Manager or above with a non-US Deloitte entity for at least one full year outside the US?":
        "managerialExp",
    };

    const target = alias[ariaLabel] ?? ariaLabel;
    await this.page.waitForTimeout(2000);

    let combo = this.page
      .getByRole("combobox", { name: new RegExp(`^${target}$`, "i") })
      .first();
    try {
      await combo.waitFor({ state: "visible", timeout: 2000 });
    } catch {
      combo = this.page
        .locator(`button[role="combobox"][name="${target}"]`)
        .first();
    }

    await combo.scrollIntoViewIfNeeded();
    await combo.waitFor({ state: "visible", timeout });

    // Try a few times to open (Salesforce Lightning requires retries)
    for (let i = 0; i < 3; i++) {
      await combo.click();
      if ((await combo.getAttribute("aria-expanded")) === "true") return this;

      await this.page.waitForTimeout(100);
      await combo.press("Enter").catch(() => {});
      if ((await combo.getAttribute("aria-expanded")) === "true") return this;

      await combo.press("ArrowDown").catch(() => {});
      if ((await combo.getAttribute("aria-expanded")) === "true") return this;
    }

    throw new Error(
      `Dropdown "${ariaLabel}" (resolved to "${target}") did not open.`
    );
  }

  public async selectOption(value: string): Promise<this> {
    const option = this.page
      .getByRole("option", { name: value })
      .first()
      .or(this.page.getByRole("menuitem", { name: value }).first());

    await option.waitFor({ state: "visible", timeout: 5_000 });
    await option.click();

    // Wait for dropdown to close (re-render happens in Lightning)
    await this.page.waitForTimeout(300);
    return this;
  }

  public async selectDropdown(label: string, value: string): Promise<this> {
    await this.openDropdown(label);
    await this.selectOption(value);
    return this;
  }

  // public async clickAcknowledgeCheckbox(): Promise<this> {
  //   // Match loosely so small text changes don’t break us
  //   await this.page
  //     .locator('label:has-text("I agree and acknowledge")')
  //     .click();

  //   await checkbox.scrollIntoViewIfNeeded();
  //   await checkbox.waitFor({ state: "attached", timeout: 5_000 });

  //   // 1) semantic way: toggles only if not already checked
  //   try {
  //     await checkbox.check(); // prefers clicking the associated <label for="...">
  //   } catch {
  //     // 2) last-resort if something keeps intercepting the click
  //     await checkbox.check({ force: true });
  //   }
  //   return this;
  // }

  public async clickAcknowledgeCheckbox(): Promise<this> {
    await this.page
      .locator('label:has-text("I agree and acknowledge")')
      .click();
    return this;
  }

  // public async clickSubmit(): Promise<this> {
  //   await this.page.getByRole("button", { name: "Submit" }).click();
  //   return this;
  // }

  async getSuccessMessage(timeout = 15_000): Promise<string> {
    await this.successCard.waitFor({ state: "visible", timeout });
    const raw = (await this.successCard.textContent()) ?? "";
    const msg = raw
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    console.log("The success message is:", msg);
    return msg;
  }

  async extractInquiryNumber(): Promise<string | null> {
    await this.inquiryNumberBold.waitFor({ state: "visible", timeout: 10_000 });
    const raw = (await this.inquiryNumberBold.textContent())?.trim() ?? "";
    const m = raw.match(/\bIXT-\d+\b/);
    console.log(`The reference number is :, ${m}`);
    return m ? m[0] : null;
  }

  async saveInquiryNumberToFile(inquiryNumber: string): Promise<void> {
    const filePath = path.join(process.cwd(), "runtime", "IXT.json");
    const data = { inquiry: inquiryNumber };

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Inquiry number ${inquiryNumber} saved to ${filePath}`);
  }

  async clickCountryDropdown(
    ariaLabel: string,
    timeout = 10_000
  ): Promise<this> {
    const listbox = this.page.getByRole("listbox", { name: ariaLabel });
    await listbox.waitFor({ state: "visible", timeout });
    await listbox.click();
    return this;
  }

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
    await this.fillField("div[class*='slds-rich-text-area']", text);
    return this;
  }

  async clickSubmit(): Promise<this> {
    await this.submitButton.scrollIntoViewIfNeeded();
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
}
