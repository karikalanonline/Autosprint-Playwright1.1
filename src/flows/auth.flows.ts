import { CustomWorld } from "../support/custom-world";
import config from "../config/config";
import { SalesforceLoginPage } from "../pages/salesforce-login-page";
import { SalesforceHomePage } from "@pages/salesforce-home-page";
import { error } from "console";

export async function loginToSalesforce(
  world: CustomWorld
): Promise<SalesforceHomePage> {
  const { page } = world;
  const loginPage = world.getPageObject(SalesforceLoginPage);

  const baseURL = config.baseUrl;
  await loginPage.navigateTo(baseURL);

  // Read creds directly from environment or fallback config
  const username = process.env.APP_USERNAME ?? config.credentials.username;
  const password = process.env.APP_PASSWORD ?? config.credentials.password;

  await loginPage.enterUsername(username);
  await loginPage.enterPassword(password);
  await loginPage.clickLoginButton();

  const homePage = world.getPageObject(SalesforceHomePage);
  const isVisible = await homePage.isHomeTabVisible();

  if (!isVisible) {
    throw new Error("Home tab is not visibled. Login may have failed");
  }
  return world.getPageObject(SalesforceHomePage);
}
