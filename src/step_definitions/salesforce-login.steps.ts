import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/custom-world";
import { SalesforceLoginPage } from "../pages/salesforce-login-page";
import config from "../config/config";

Given(
  "I am on the Salesforce login page {string}",
  async function (this: CustomWorld, url: string) {
    const loginPage = this.getPageObject(SalesforceLoginPage);
    await loginPage.navigateTo(config.baseUrl);
    expect(await loginPage.isLoginPageReady()).toBeTruthy();
  }
);

When(
  "I enter my User Name as {string} in the username field",
  async function (this: CustomWorld, username: string) {
    const loginPage = this.getPageObject(SalesforceLoginPage);
    await loginPage.enterUsername(config.credentials.username);
  }
);

When(
  "I enter my Password as {string} in the password field",
  async function (this: CustomWorld, password: string) {
    const loginPage = this.getPageObject(SalesforceLoginPage);
    await loginPage.enterPassword(config.credentials.password);
  }
);

When(
  "I click the {string} button",
  async function (this: CustomWorld, buttonName: string) {
    const loginPage = this.getPageObject(SalesforceLoginPage);
    await loginPage.clickLoginButton();
  }
);

Then(
  "I should be successfully logged into the Salesforce Sandbox environment",
  async function (this: CustomWorld) {
    // honor your pattern; simple stabilization wait if needed
    await this.page.pause();
    await this.page.waitForURL(/\/lightning\/.*/i, { timeout: 30000 });
  }
);

Then(
  "I should be see the Home tab in salesforce home page",
  async function (this: CustomWorld) {
    const loginPage = this.getPageObject(SalesforceLoginPage);
    const salesforceHomePage = await loginPage.clickLoginButton();
    const isHomeTabVisible = await salesforceHomePage.isHomeTabVisible();
    expect(isHomeTabVisible).toBeTruthy();
  }
);
