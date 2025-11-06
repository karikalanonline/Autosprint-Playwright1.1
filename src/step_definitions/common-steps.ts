import { Given } from "@cucumber/cucumber";
import { CustomWorld } from "../support/custom-world";
import { loginToSalesforce } from "../flows/auth.flows";

Given("I am logged into Salesforce", async function (this: CustomWorld) {
  await loginToSalesforce(this);
});
