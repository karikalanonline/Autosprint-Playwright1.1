import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";

export class CustomEmailPage extends BasePage {
  // anchors / helpers
  private readonly customEmailNumberLabel: Locator;

  // We’ll evaluate these selectors at runtime; keeping the strings local makes it
  // easy to tweak without spreading them around the class.
  private readonly candidateSelectors: string[];

  constructor(page: Page) {
    super(page);

    this.customEmailNumberLabel = this.page.locator(
      "span.test-id__field-label:has-text('Custom Email Number')"
    );

    this.candidateSelectors = [
      // explicit Email Status label (preferred)
      "div.slds-form-element:has(span.test-id__field-label:has-text('Email Status')) span.test-id__field-value",
      // sometimes lightning-formatted-text lives in slot
      "div.slds-form-element:has(span.test-id__field-label:has-text('Email Status')) slot[name='outputField'] lightning-formatted-text",
      // fallback within the Custom Email block for generic 'Status'
      "xpath=//span[text()='Custom Email Number']/ancestor::div[contains(@class,'records-record-layout-row') or contains(@class,'slds-grid')][1]//div[contains(@class,'slds-form-element') and .//span[contains(@class,'test-id__field-label') and normalize-space(text())='Status']]//span[contains(@class,'test-id__field-value')]",
      // generic Status (last resorts)
      "div.slds-form-element:has(span.test-id__field-label:has-text('Status')) span.test-id__field-value",
      "div.slds-form-element:has(span.test-id__field-label:has-text('Status')) slot[name='outputField'] lightning-formatted-text",
    ];
  }

  /** Wait until the Custom Email record view is actually visible. */
  async waitUntilLoaded(timeout = 10_000): Promise<this> {
    // If you also have a URL regex, you can add: await this.page.waitForURL(/CustomEmail__c\/.*/i, { timeout }).catch(()=>{});
    await this.customEmailNumberLabel
      .waitFor({ state: "visible", timeout })
      .catch(() => void 0);
    return this;
  }

  /**
   * Returns the visible, non-empty Email Status/Status value.
   * Throws if nothing suitable is found.
   */
  async getStatusValue(timeout = 10_000): Promise<string> {
    await this.waitUntilLoaded(timeout);

    for (const sel of this.candidateSelectors) {
      let count = 0;
      try {
        count = await this.page.locator(sel).count();
      } catch {
        count = 0;
      }
      if (count === 0) continue;

      for (let i = 0; i < count; i++) {
        const node = this.page.locator(sel).nth(i);

        // visible preferred (skip hidden/old nodes)
        let visible = true;
        try {
          visible = await node.isVisible();
        } catch {
          // keep going; we’ll still try to read text
        }
        if (!visible) continue;

        // read what a user would see
        let txt = "";
        try {
          txt = (await node.innerText({ timeout: 500 })).trim();
        } catch {
          try {
            txt = (await node.textContent({ timeout: 500 }))?.trim() ?? "";
          } catch {
            txt = "";
          }
        }

        if (txt && !txt.toLowerCase().startsWith("change")) {
          return txt;
        }
      }
    }

    await this.dumpCandidatesForDebug();
    throw new Error(
      `Status value not visible within ${timeout}ms (url=${this.page.url})`
    );
  }

  /** Developer helper: print candidate nodes to console for quick triage. */
  private async dumpCandidatesForDebug(): Promise<void> {
    console.log("--- CustomEmailPage: dumping candidate nodes for Status ---");
    for (const sel of this.candidateSelectors) {
      const nodes = this.page.locator(sel);
      let count = 0;
      try {
        count = await nodes.count();
      } catch {
        // ignore
      }
      console.log(`selector=${JSON.stringify(sel)} count=${count}`);
      for (let i = 0; i < count; i++) {
        const n = nodes.nth(i);
        let vis = "<err>";
        let text = "<err>";
        try {
          vis = String(await n.isVisible());
        } catch {}
        try {
          text = (await n.innerText({ timeout: 300 })).trim();
        } catch {
          try {
            text = (await n.textContent({ timeout: 300 }))?.trim() ?? "";
          } catch {
            text = "<textContent-error>";
          }
        }
        console.log(`  [${i}] visible=${vis} text=${JSON.stringify(text)}`);
      }
    }
  }
}
