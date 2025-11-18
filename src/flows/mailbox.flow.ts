import { SalesforceHomePage } from "../pages/salesforce-home-page";
import { MailboxSyncHomePage } from "../pages/mailbox-sync-home-page";

export async function openMailboxSyncFromHome(
  proxySfHome: SalesforceHomePage
): Promise<MailboxSyncHomePage> {
  await proxySfHome.switchToLightning();
  await proxySfHome.clickAppLauncher();
  const mailboxHome = await proxySfHome.clickMailboxSyncTab();
  return mailboxHome;
}
