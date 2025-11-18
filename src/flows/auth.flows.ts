import { CustomWorld } from "../support/custom-world";
import config from "../config/config";
import { SalesforceLoginPage } from "../pages/salesforce-login-page";
import { SalesforceHomePage } from "@pages/salesforce-home-page";
import { MailboxSyncHomePage } from "../pages/mailbox-sync-home-page";
import { error } from "console";
import { MailboxSyncRecordPage } from "@pages/mailbox-sync-record-page";
import fs from "fs";
import path from "path";

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
  await homePage.switchToLightning();
  const isVisible = await homePage.isHomeTabVisible();

  if (!isVisible) {
    throw new Error("Home tab is not visibled. Login may have failed");
  }
  return world.getPageObject(SalesforceHomePage);
}

export async function proxyLogin(
  world: CustomWorld
): Promise<SalesforceHomePage> {
  const businessUsername = await readBusinessUsernameFromTestData();
  const ixtNumber = await readIxtFromRuntime();

  const sfHomePage = world.getPageObject(SalesforceHomePage);
  const sfAdminPage = await sfHomePage.goToAdminPage();

  const proxiedSfHomePage = await sfAdminPage.proxyLogin(businessUsername);

  world.proxySfHomePage = proxiedSfHomePage;

  return proxiedSfHomePage;
}

export async function readBusinessUsernameFromTestData(): Promise<string> {
  const projectRoot = process.cwd();
  const usersPath = path.join(projectRoot, "src", "test-data", "users.json");
  let usersJson: any;
  try {
    const raw = fs.readFileSync(usersPath, "utf8");
    usersJson = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to read users.json at ${usersPath}: ${String(err)}`
    );
  }

  const usersNode = usersJson?.users ?? usersJson;
  // exact key from your screenshot
  if (
    usersNode &&
    typeof usersNode === "object" &&
    usersNode["Business_user_name_1"]
  ) {
    return String(usersNode["Business_user_name_1"]);
  }

  // fallback: first key containing 'business'
  if (usersNode && typeof usersNode === "object") {
    const found = Object.entries(usersNode).find(([k]) => /business/i.test(k));
    if (found) return String(found[1]);
    // fallback: single string value
    const stringValues = Object.values(usersNode).filter(
      (v) => typeof v === "string"
    );
    if (stringValues.length === 1) return String(stringValues[0]);
  }

  throw new Error(
    `Could not determine business username from ${usersPath}. Add "Business_user_name_1".`
  );
}

export async function readIxtFromRuntime(): Promise<string> {
  const projectRoot = process.cwd();
  const runtimePath = path.join(projectRoot, "runtime", "IXT.json");
  try {
    const raw = fs.readFileSync(runtimePath, "utf8");
    const j = JSON.parse(raw);
    // common shapes: { "ixt": "IMG-123" } or { "inquiryNumber": "IMG-123" } or plain string
    const num =
      j?.ixt ||
      j?.inquiryNumber ||
      j?.IXT ||
      j?.inquiry ||
      (typeof j === "string" ? j : undefined);
    if (num) return String(num);

    // fallback: if runtime has exactly one string value, return that
    if (typeof j === "object") {
      const strVals = Object.values(j).filter((v) => typeof v === "string");
      if (strVals.length === 1) return String(strVals[0]);
    }
    throw new Error(`Could not determine IXT value from ${runtimePath}`);
  } catch (err) {
    throw new Error(
      `Failed to read runtime IXT file at ${runtimePath}: ${String(err)}`
    );
  }
}
