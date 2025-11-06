import { BasePage } from "./basePage";
import { Locator, Page } from "@playwright/test";
import { SalesforceHomePage } from "./salesforce-home-page";

export class SalesforceLoginPage extends BasePage {
  private readonly usernameFieldSelector = "#username";
  private readonly passwordFieldSelector = "#password";
  private readonly loginButtonSelector = "#Login";
  private readonly homeTab = "a[title='Home']";

  constructor(page: Page) {
    super(page);
  }

  async enterUsername(username: string): Promise<void> {
    try {
      await this.page.fill(this.usernameFieldSelector, username);
      this.logInfo(`Entered username: ${username}`);
    } catch (error) {
      this.logError(`Failed to enter username: ${error}`);
      throw error;
    }
  }

  async isLoginPageReady(): Promise<boolean> {
    return this.page.isVisible(this.usernameFieldSelector);
  }

  async enterPassword(password: string): Promise<void> {
    try {
      await this.page.fill(this.passwordFieldSelector, password);
      this.logInfo(`Entered password: ${password}`);
    } catch (error) {
      this.logError(`Failed to enter password: ${error}`);
      throw error;
    }
  }

  async clickLoginButton(): Promise<SalesforceHomePage> {
    try {
      await this.page.click(this.loginButtonSelector);
      this.logInfo("Clicked login button");
    } catch (error) {
      this.logError(`Failed to click login button: ${error}`);
      throw error;
    }
    return new SalesforceHomePage(this.page);
  }
}
