import { CustomWorld } from "../support/custom-world";
import { SalesforceHomePage } from "@pages/salesforce-home-page";
import { IxtMailboxApp } from "@pages/ixt-mailbox-home-page";
import { IxtWebFormHomePage } from "@pages/ixt-webform-home-page";

export async function goToIxtWebForm(world: CustomWorld): Promise<void> {
  const { page } = world;
  const homePage = world.getPageObject(SalesforceHomePage);
  await homePage.clickAppLauncher();
  await homePage.clickMailboxSyncTab();
  const ixtMailboxApp = await homePage.searchAndSelectIxtWebForm();
}
