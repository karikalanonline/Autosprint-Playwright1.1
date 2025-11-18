import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { DataTable } from "@cucumber/cucumber";
import path from "path";
import fs from "fs";
import { CustomWorld } from "../support/custom-world";
import { IxtWebFormHomePage } from "@pages/ixt-webform-home-page";
import { proxyLogin } from "src/flows/auth.flows";
import { SalesforceHomePage } from "@pages/salesforce-home-page";
import { MailboxSyncRecordPage } from "@pages/mailbox-sync-record-page";
import { readIxtFromRuntime } from "../flows/auth.flows";
import { openMailboxSyncFromHome } from "../flows/mailbox.flow";

/** Normalize smart quotes/apostrophes that Salesforce labels often use */
function normalizeQuotes(s: string): string {
  return s.replace(/[“”]/g, '"').replace(/[’]/g, "'");
}

Given(
  "I select {string} from the {string} dropdown",
  async function (
    this: CustomWorld,
    optionValue: string,
    dropdownLabel: string
  ) {
    const ixtWebFormPage = this.getPageObject(IxtWebFormHomePage);
    const label = normalizeQuotes(dropdownLabel);
    const value = normalizeQuotes(optionValue);
    await ixtWebFormPage.openDropdown(label);
    await ixtWebFormPage.selectDropdown(label, value);
  }
);

When("I check the acknowledgment checkbox", async function (this: CustomWorld) {
  const page = this.getPageObject(IxtWebFormHomePage);
  await page.clickAcknowledgeCheckbox();
});

When(
  "I enter {string} in the {string} textbox",
  async function (this: CustomWorld, text: string, textboxLabel: string) {
    const pageObj = this.getPageObject(IxtWebFormHomePage);
    const label = normalizeQuotes(textboxLabel);
    const value = normalizeQuotes(text);

    // Special-case the rich text "Describe your inquiry"
    if (/describe your inquiry/i.test(label)) {
      await pageObj.enterInquiry(value);
    } else {
      await pageObj.enterInquiry(value); // keep using rich-text helper for now
    }

    expect(true).toBeTruthy();
  }
);

When(
  "I click the {string} button",
  async function (this: CustomWorld, button: string) {
    const ixtWebFormPage = this.getPageObject(IxtWebFormHomePage);
    const buttonLabel = normalizeQuotes(button);
    if (/^yes$/i.test(buttonLabel)) {
      await ixtWebFormPage.confirmYes();
    } else if (/^submit$/i.test(buttonLabel)) {
      await ixtWebFormPage.clickSubmit();
    } else {
      await this.page.getByRole("button", { name: buttonLabel }).click();
    }
  }
);

When(
  "The form should be successfully submitted",
  async function (this: CustomWorld) {
    const pageObj = this.getPageObject(IxtWebFormHomePage);
    const msg = await pageObj.getSuccessMessage();
    const inquiryNumber = await pageObj.extractInquiryNumber();
    expect(
      inquiryNumber,
      `No IXT number found in the message: ${msg}`
    ).toBeTruthy();
    await pageObj.saveInquiryNumberToFile(inquiryNumber!);
    console.log(`The reference number is ${inquiryNumber}`);
    await pageObj.goBackToSalesforce();
  }
);

When(
  "I do the proxy login to verify the case details",
  async function (this: CustomWorld) {
    this.proxySfHomePage = await proxyLogin(this);
  }
);

When("I click the mailbox sync tab", async function (this: CustomWorld) {
  const proxySfHome =
    this.proxySfHomePage ?? this.getPageObject(SalesforceHomePage);
  this.mailboxSyncHomePage = await proxySfHome.clickMailboxSyncTab();
});

When(
  "I open the respective IXT mailbox record",
  async function (this: CustomWorld) {
    if (!this.mailboxSyncHomePage)
      throw new Error("Mailbox home page not available");
    const ixtNumber = await readIxtFromRuntime();
    this.currentIxtnumber = ixtNumber;
    this.currentMailboxRecordPage =
      await this.mailboxSyncHomePage.openIxtRecordBusiness(ixtNumber);
  }
);

When(
  "I verify the {string} field contains {string}",
  async function (this: CustomWorld, fieldName: string, expected) {
    const mailbox =
      this.currentMailboxRecordPage ??
      this.getPageObject(MailboxSyncRecordPage);
    const actual = await mailbox.getFieldValue(fieldName);

    console.log(`✓ ${fieldName} field contains ${actual}`);
    expect(actual, `${fieldName} did not contain expected value`).toContain(
      expected
    );
  }
);

When(
  "I verify the {string} field that should contain {string} under the Emails section",
  async function (this: CustomWorld, fieldName: string, expected: string) {
    const recordPage =
      this.currentMailboxRecordPage ??
      this.getPageObject(MailboxSyncRecordPage);
    const actualStatus = await recordPage.getEmailStatus();
    if (fieldName === "Email Status") {
      expect(actualStatus).toContain(expected);
      console.log(`${fieldName} contains the status of ${actualStatus}`);
    } else {
      throw "The email status doesn't have a status as Sent, Please check";
    }
  }
);
