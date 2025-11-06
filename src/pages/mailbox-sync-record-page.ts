import { Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";
import { CustomEmailPage } from "./custom-email-II-page";

export class MailboxSyncRecordPage extends BasePage {
  // Core selectors
  private readonly emailTileLink: Locator;

  // Template for a Lightning field container by label text
  private byLabel(label: string): Locator {
    return this.page.locator(
      `div.slds-form-element:has(span.test-id__field-label:has-text("${label}"))`
    );
  }

  constructor(page: Page) {
    super(page);
    this.emailTileLink = this.page.locator("h3.slds-tile__title >> a", {
      hasText: "EMAIL",
    });
  }

  private async resolveValueNode(
    label: string,
    timeout = 8_000
  ): Promise<Locator> {
    const container = this.byLabel(label);

    // Wait for the container to exist (navigation may still be settling)
    await container
      .first()
      .waitFor({ state: "attached", timeout })
      .catch(async () => {
        // Produce a helpful error snapshot if the label block isn't found
        const sample = await this.page
          .locator("div.slds-form-element")
          .first()
          .innerHTML()
          .catch(() => "<could-not-read-sample>");
        throw new Error(
          `Could not find label container for "${label}" at ${this.page.url}\n` +
            `Sample nearby HTML: ${String(sample).slice(0, 2000)}`
        );
      });

    if ((await container.count()) === 0) {
      const foundLabels = await this.page
        .locator("span.test-id__field-label")
        .allInnerTexts()
        .catch(() => []);
      throw new Error(
        `Label container matched zero nodes for label "${label}".\n` +
          `Labels found: ${JSON.stringify(foundLabels)}\n` +
          `URL: ${this.page.url}`
      );
    }

    // Candidate child selectors (relative to container)
    const candidates = [
      "slot >> span",
      "span.owner-name",
      ".slds-form-element__control span.test-id__field-value",
      ".slds-form-element__control lightning-formatted-text",
      ".slds-form-element__control .slds-form-element__static",
    ];

    for (const rel of candidates) {
      const loc = container.locator(rel);
      const count = await loc.count();
      if (count === 0) continue;

      for (let i = 0; i < count; i++) {
        const node = loc.nth(i);
        const text = await node
          .innerText({ timeout: 500 })
          .catch(() => "")
          .then((t) => t.trim());
        if (!text) continue;
        if (text.toLowerCase().startsWith("change")) continue; // skip edit hints
        return node;
      }
    }

    const html = await container
      .first()
      .innerHTML()
      .catch(() => "<no-html>");
    throw new Error(
      `Could not find value node for label "${label}". Container HTML: ${String(
        html
      ).slice(0, 2000)}`
    );
  }

  /**
   * Get visible text for a field by label (e.g., "Record Type").
   */
  async getFieldValueByLabel(label: string, timeout = 8_000): Promise<string> {
    const node = await this.resolveValueNode(label, timeout);
    const txt =
      (
        await node
          .innerText()
          .catch(async () => (await node.textContent()) ?? "")
      )?.trim() ?? "";
    return txt;
  }

  /**
   * Convenience: collect multiple fields (keys) into an object of { label: value }.
   * Use this in steps to compare with expected maps.
   */
  async getFieldValues(
    labels: string[],
    timeoutPerField = 8_000
  ): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    for (const label of labels) {
      try {
        out[label] = await this.getFieldValueByLabel(label, timeoutPerField);
      } catch (e: any) {
        out[label] = `<not-found: ${e?.message ?? e}>`;
      }
    }
    return out;
  }

  /**
   * Click the EMAIL tile link and transition into the Custom Email record page.
   * Uses URL hint + unique element wait for stability (SPA-friendly).
   */
  async clickEmailLink(): Promise<CustomEmailPage> {
    await this.emailTileLink.first().click();

    // Try to stabilize on URL; ignore failures (Lightning can be SPA-y)
    const emailUrlPattern = /\/lightning\/r\/Custom_Email_2__c\//i;
    await this.page
      .waitForURL(emailUrlPattern, { timeout: 8_000 })
      .catch(() => {});

    // Wait for something unique on the Custom Email page
    const uniqueSelectors = [
      "span.test-id__field-label:has-text('Custom Email Number')",
      "span.test-id__field-label:has-text('Email Status')",
      "h1:has-text('Email'), h1:has-text('Custom Email')",
    ];
    for (const sel of uniqueSelectors) {
      const target = this.page.locator(sel).first();
      const ok = await target
        .waitFor({ state: "attached", timeout: 4_000 })
        .then(() => true)
        .catch(() => false);
      if (ok) break;
    }

    // brief settle (optional; prefer explicit waits in caller if needed)
    await this.page.waitForLoadState("domcontentloaded").catch(() => {});
    return new CustomEmailPage(this.page);
  }
}
