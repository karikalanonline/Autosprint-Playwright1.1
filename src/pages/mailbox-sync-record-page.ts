import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "./basePage";
import { CustomEmailPage } from "./custom-email-II-page";

export class MailboxSyncRecordPage extends BasePage {
  // Core selectors
  private readonly emailTileLink: Locator;
  private readonly emailStatus: Locator;

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
    this.emailStatus = this.page.locator("span[title='Sent']");
  }

  async getFieldValue(label: string, timeout = 20_000): Promise<string> {
    if (!label) throw new Error("getFieldValue: label required");

    const wanted = label.trim();
    const wantedLower = wanted.toLowerCase();
    const wantedTokens = wantedLower.split(" ").filter(Boolean);

    const start = Date.now();

    const normalize = (s: string | null | undefined) =>
      (s ?? "").toString().trim().toLowerCase();

    const safeInner = async (loc: Locator) =>
      (await loc.innerText().catch(() => "")).trim();

    // allow the Lightning page to settle
    await this.page.waitForLoadState("networkidle").catch(() => {});
    await this.page.waitForTimeout(200);

    while (Date.now() - start < timeout) {
      for (const f of this.page.frames()) {
        try {
          // =========================================================
          // (1) FAST EXACT ATTRIBUTE MATCH (BEST PATH)
          // =========================================================
          const exactSelectors = [
            `records-record-layout-item[field-label="${wanted}"] .test-id__field-value`,
            `records-record-layout-item[field-label="${wanted}"] lightning-formatted-text`,
            `records-record-layout-item[field-label="${wanted}"] span.owner-name`,
            `records-record-layout-item[field-label="${wanted}"] slot[name="outputField"] lightning-formatted-text`,
          ];

          for (const s of exactSelectors) {
            const loc = f.locator(s).first();
            if ((await loc.count()) > 0) {
              await loc
                .waitFor({ state: "visible", timeout: 1000 })
                .catch(() => {});
              await loc.scrollIntoViewIfNeeded().catch(() => {});

              const v = await safeInner(loc);
              if (normalize(v)) return v;
            }
          }

          // =========================================================
          // (2) SAFER ATTRIBUTE-CONTAINS MATCH
          //     With strict token checking
          // =========================================================
          const xpath = `xpath=//records-record-layout-item[contains(
            translate(@field-label,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),
            "${wantedLower}"
        )]`;

          const containers = f.locator(xpath);
          const count = await containers.count();

          for (let i = 0; i < count; i++) {
            const c = containers.nth(i);

            const attr = await c.getAttribute("field-label").catch(() => "");
            const attrNorm = normalize(attr);

            const visibleLabel = normalize(
              await c
                .locator(
                  ".test-id__field-label, label.slds-form-element__label"
                )
                .first()
                .innerText()
                .catch(() => "")
            );

            // ------- strict token match ------
            const tokensMatch = (str: string) =>
              str && wantedTokens.every((t) => str.includes(t));

            if (tokensMatch(attrNorm) || tokensMatch(visibleLabel)) {
              const val = c
                .locator(
                  '.test-id__field-value, lightning-formatted-text, span.owner-name, .slds-form-element__control a, slot[name="outputField"] lightning-formatted-text'
                )
                .first();

              if ((await val.count()) > 0) {
                await val
                  .waitFor({ state: "visible", timeout: 1000 })
                  .catch(() => {});
                await val.scrollIntoViewIfNeeded().catch(() => {});

                const v = await safeInner(val);
                const normV = normalize(v);

                // Skip label text
                if (normV && normV !== wantedLower) return v;
              }
            }
          }

          // =========================================================
          // (3) CLASSIC LABEL → ANCESTOR → VALUE (SECONDARY FALLBACK)
          // =========================================================
          const labelNode = f
            .locator(
              "span.test-id__field-label, label.slds-form-element__label",
              {
                hasText: wanted,
              }
            )
            .first();

          if ((await labelNode.count()) > 0) {
            const container2 = labelNode
              .locator(
                'xpath=ancestor::div[contains(@class,"slds-form-element")][1]'
              )
              .first();

            const val = container2
              .locator(
                ".slds-form-element__control .test-id__field-value, .slds-form-element__control lightning-formatted-text, .slds-form-element__control span.owner-name, .slds-form-element__control a"
              )
              .first();

            if ((await val.count()) > 0) {
              await val
                .waitFor({ state: "visible", timeout: 1000 })
                .catch(() => {});
              await val.scrollIntoViewIfNeeded().catch(() => {});
              const v = await safeInner(val);
              if (normalize(v)) return v;
            }
          }

          // =========================================================
          // (4) OWNER SPECIAL FALLBACK (force-owner-lookup)
          // =========================================================
          if (wantedLower === "owner" || wantedLower.includes("owner")) {
            const ownerLoc = f
              .locator(
                `xpath=//span[contains(@class,"owner-name") and normalize-space()]`
              )
              .first();

            if ((await ownerLoc.count()) > 0) {
              await ownerLoc
                .waitFor({ state: "visible", timeout: 1000 })
                .catch(() => {});
              const v = await safeInner(ownerLoc);
              if (normalize(v)) return v;
            }
          }
        } catch {
          // ignore frame errors
        }
      }

      await this.page.waitForTimeout(300);
    }

    // =========================================================
    // If completely failed — show diagnostics
    // =========================================================
    const frameInfo = [];
    for (const f of this.page.frames()) {
      frameInfo.push({
        url: f.url(),
        records: await f
          .locator("records-record-layout-item")
          .count()
          .catch(() => -1),
        slds: await f
          .locator("div.slds-form-element")
          .count()
          .catch(() => -1),
      });
    }

    throw new Error(
      `getFieldValue: timed out after ${timeout}ms for label "${label}".\nFrames:\n${JSON.stringify(
        frameInfo,
        null,
        2
      )}`
    );
  }

  public async waitForPageLoad(timeout = 10_000): Promise<void> {
    try {
      // wait for any unique stable element on this page (adjust selector if needed)
      await this.page
        .locator("span.test-id__field-label:has-text('Record Type')")
        .first()
        .waitFor({ state: "visible", timeout });
    } catch (e) {
      // fallback if label not found immediately
      await this.page.waitForLoadState("domcontentloaded", { timeout });
    }
  }

  async getEmailStatus(): Promise<string> {
    await this.emailStatus.waitFor({ state: "visible", timeout: 5_000 });
    return await this.emailStatus.innerText();
  }
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
