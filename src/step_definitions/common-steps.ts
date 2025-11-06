import { Given } from "@cucumber/cucumber";
import { CustomWorld } from "../support/custom-world";
import { loginToSalesforce } from "../flows/auth.flows";
import { goToIxtWebForm } from "src/flows/ixt.flow";

Given("I am logged into Salesforce", async function (this: CustomWorld) {
  await loginToSalesforce(this);
});

Given("Navigate to the IXT WebForm Page", async function (this: CustomWorld) {
  await goToIxtWebForm(this);
});
