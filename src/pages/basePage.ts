import { Page, Locator } from "@playwright/test";
import path from "path";
import fs from "fs";

export class BasePage {
  protected page: Page;
  private readonly appLauncher: Locator;
  private readonly globalSearchTextBox: Locator;

  /**
   * BasePage Methods Index:
   * 1. constructor(page: Page)
   * 2. navigateTo(url: string): Promise<void>
   * 3. waitForElement(selector: string, timeout: number): Promise<void>
   * 4. clickElement(selector: string): Promise<void>
   * 5. fillField(selector: string, value: string): Promise<void>
   * 6. getTextFromElement(selector: string): Promise<string>
   * 7. elementExists(selector: string): Promise<boolean>
   * 8. takeScreenshot(name: string): Promise<void>
   * 9. logInfo(message: string): void
   * 10. logError(message: string): void
   * 11. waitForTimeout(milliseconds: number): Promise<void>
   * 12. handleIframe(iframeSelector: string, buttonSelector: string, buttonText?: string): Promise<boolean>
   * 13. clickElementByXPath(xpath: string, retries: number): Promise<void>
   * 14. getTextByXPath(xpath: string): Promise<string>
   * 15. fillFieldByXPath(xpath: string, value: string): Promise<void>
   * 16. takeDebugScreenshot(baseName: string): Promise<void>
   * 17. waitForSelectorAndClick(selector: string, timeout: number): Promise<void>
   * 18. checkAllMatchingCheckboxes(selector: string): Promise<number>
   * 19. pressKey(key: string): Promise<void>
   * 20. handleFileDownload(clickSelector: string, downloadDir?: string): Promise<string>
   * 21. handleFileUpload(clickSelector: string, filePath: string): Promise<void>
   * 22. fillLocator(locator: any, value: string): Promise<void>
   * 23. clickLocator(locator: any): Promise<void>
   * 24. typeText(locator: any, text: string): Promise<void>
   * 25. pressKeyInLocator(locator: any, key: string): Promise<void>
   * 26. selectDropdownByValue(selector: string, value: string): Promise<void>
   * 27. selectDropdownByText(selector: string, text: string): Promise<void>
   * 28. selectDropdownByIndex(selector: string, index: number): Promise<void>
   * 29. selectDropdownByXPath(dropdownXPath: string, optionText: string): Promise<void>
   * 30. selectDropdownOptionByPartialText(selector: string, partialText: string): Promise<void>
   * 31. getDropdownOptions(selector: string): Promise<string[]>
   * 32. selectDropdownWithSearch(dropdownSelector: string, searchText: string, optionSelector?: string): Promise<void>
   * 33. selectFromCustomDropdown(triggerSelector: string, optionSelector: string, optionText: string): Promise<void>
   */

  constructor(page: Page) {
    this.page = page;
    this.appLauncher = this.page.locator("button[title='App Launcher']");
    this.globalSearchTextBox = this.page.locator("button[aria-label='Search']");
  }

  protected async retryAction<T>(
    fn: () => Promise<T>,
    attempts = 3,
    delayMs = 400
  ): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (i < attempts - 1) {
          await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, i)));
        }
      }
    }
    throw lastErr;
  }

  private formatValue(value: string | number | Date): string {
    if (value instanceof Date) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const d = String(value.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    return String(value);
  }

  private asLocator(target: string | Locator): Locator {
    return typeof target === "string"
      ? this.page.locator(target).first()
      : target.first();
  }

  protected async fill(
    target: string | Locator,
    value: string | number | Date
  ): Promise<void> {
    const locator = this.asLocator(target);
    const text = this.formatValue(value);
    await this.retryAction(async () => locator.fill(text));
  }

  protected async type(
    target: string | Locator,
    value: string | number | Date,
    delay = 200
  ): Promise<void> {
    const locator = this.asLocator(target);
    const text = this.formatValue(value);
    await this.retryAction(async () => locator.type(text, { delay }));
  }

  async navigateTo(url: string): Promise<void> {
    try {
      await this.page.goto(url);
      this.logInfo(`Navigated to: ${url}`);
    } catch (error) {
      this.logError(`Failed to navigate to ${url}: ${error}`);
      throw error;
    }
  }

  async clickElement(selector: string): Promise<void> {
    await this.page.click(selector);
    this.logInfo(`Clicked on element with selector: ${selector}`);
  }

  async fillField(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
    this.logInfo(`Filled field ${selector} with value: ${value}`);
  }

  async searchOnGlobalSearch(selector: string, value: string) {
    await this.page.fill(selector, value);
    this.logInfo("Entered the ixt ref number in the global search text box");
  }

  async getTextFromElement(selector: string): Promise<string> {
    const text = (await this.page.textContent(selector)) || "";
    return text.trim();
  }

  async elementExists(selector: string): Promise<boolean> {
    const element = await this.page.$(selector);
    return element !== null;
  }

  async waitForElement(
    selector: string,
    timeout: number = 30000
  ): Promise<void> {
    try {
      await this.page.waitForSelector(selector, {
        state: "visible",
        timeout,
      });
      this.logInfo(`Element found: ${selector}`);
    } catch (error) {
      this.logError(`Element not found within ${timeout}ms: ${selector}`);
      throw error;
    }
  }

  async typeText(locator: any, text: string): Promise<void> {
    try {
      await locator.waitFor({ state: "visible", timeout: 5000 });
      await locator.type(text);
      this.logInfo(`Typed text into field: ${text}`);
    } catch (error) {
      this.logError(`Failed to type text: ${error}`);
      throw error;
    }
  }

  async selectDropdownByText(selector: string, text: string): Promise<void> {
    try {
      await this.page.selectOption(selector, { label: text });
      this.logInfo(
        `Selected dropdown option with text: ${text} from selector: ${selector}`
      );
    } catch (error) {
      this.logError(
        `Failed to select dropdown option by text ${text}: ${error}`
      );
      throw error;
    }
  }

  async selectDropdownByIndex(selector: string, index: number): Promise<void> {
    try {
      await this.page.selectOption(selector, { index: index });
      this.logInfo(
        `Selected dropdown option at index: ${index} from selector: ${selector}`
      );
    } catch (error) {
      this.logError(
        `Failed to select dropdown option by index ${index}: ${error}`
      );
      throw error;
    }
  }

  async selectDropdownByXPath(
    dropdownXPath: string,
    optionText: string,
    timeout: number = 5000
  ): Promise<void> {
    try {
      // Click the dropdown to open it
      await this.clickElementByXPath(dropdownXPath);
      this.logInfo(`Opened dropdown: ${dropdownXPath}`);

      // Wait a moment for dropdown to open
      await this.waitForTimeout(500);

      // Find and click the option
      const optionXPath = `//li[contains(text(), "${optionText}")] | //option[contains(text(), "${optionText}")] | //div[contains(text(), "${optionText}")]`;

      await this.page.waitForSelector(`xpath=${optionXPath}`, { timeout });
      await this.clickElementByXPath(optionXPath);

      this.logInfo(`Selected dropdown option: ${optionText}`);
    } catch (error) {
      this.logError(
        `Failed to select dropdown option by XPath. Dropdown: ${dropdownXPath}, Option: ${optionText}, Error: ${error}`
      );
      throw error;
    }
  }

  async selectDropdownOptionByPartialText(
    selector: string,
    partialText: string
  ): Promise<void> {
    try {
      const options = await this.page.locator(`${selector} option`).all();

      for (const option of options) {
        const optionText = (await option.textContent()) || "";
        if (optionText.toLowerCase().includes(partialText.toLowerCase())) {
          const value = (await option.getAttribute("value")) || "";
          await this.page.selectOption(selector, value);
          this.logInfo(
            `Selected dropdown option containing text: ${partialText} (full text: ${optionText})`
          );
          return;
        }
      }

      throw new Error(`No option found containing text: ${partialText}`);
    } catch (error) {
      this.logError(
        `Failed to select dropdown option by partial text ${partialText}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Get all available options from a dropdown
   * @param selector - The selector for the dropdown
   * @returns Array of option texts
   */
  async getDropdownOptions(selector: string): Promise<string[]> {
    try {
      const options = await this.page.locator(`${selector} option`).all();
      const optionTexts: string[] = [];

      for (const option of options) {
        const text = (await option.textContent()) || "";
        if (text.trim()) {
          optionTexts.push(text.trim());
        }
      }

      this.logInfo(
        `Retrieved ${optionTexts.length} options from dropdown: ${selector}`
      );
      return optionTexts;
    } catch (error) {
      this.logError(`Failed to get dropdown options: ${error}`);
      throw error;
    }
  }

  async selectDropdownWithSearch(
    dropdownSelector: string,
    searchText: string,
    optionSelector?: string
  ): Promise<void> {
    try {
      // Click to open the dropdown
      await this.clickElement(dropdownSelector);
      this.logInfo(`Opened searchable dropdown: ${dropdownSelector}`);

      // Wait for dropdown to open
      await this.waitForTimeout(500);

      // Type in the search field (usually the dropdown has an input that appears)
      await this.page.keyboard.type(searchText);
      this.logInfo(`Typed search text: ${searchText}`);

      // Wait for search results
      await this.waitForTimeout(1000);

      // Click the option
      if (optionSelector) {
        await this.clickElement(optionSelector);
      } else {
        // Try common selectors for dropdown options
        const commonSelectors = [
          `//li[contains(text(), "${searchText}")]`,
          `//div[contains(text(), "${searchText}")]`,
          `//span[contains(text(), "${searchText}")]`,
          `.option:has-text("${searchText}")`,
          `.select2-result:has-text("${searchText}")`,
        ];

        let optionFound = false;
        for (const sel of commonSelectors) {
          try {
            if (
              sel.startsWith("//") ||
              sel.startsWith(".") ||
              sel.startsWith("#")
            ) {
              if (sel.startsWith("//")) {
                await this.clickElementByXPath(sel);
              } else {
                await this.clickElement(sel);
              }
              optionFound = true;
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        if (!optionFound) {
          throw new Error(`Could not find option with text: ${searchText}`);
        }
      }

      this.logInfo(`Selected searchable dropdown option: ${searchText}`);
    } catch (error) {
      this.logError(`Failed to select from searchable dropdown: ${error}`);
      throw error;
    }
  }

  /**
   * Select from custom dropdown (non-select elements)
   * @param triggerSelector - Selector for the element that opens the dropdown
   * @param optionSelector - Selector pattern for options (use {text} placeholder)
   * @param optionText - Text of the option to select
   */
  async selectFromCustomDropdown(
    triggerSelector: string,
    optionSelector: string,
    optionText: string
  ): Promise<void> {
    try {
      // Click trigger to open dropdown
      await this.clickElement(triggerSelector);
      this.logInfo(`Opened custom dropdown: ${triggerSelector}`);

      // Wait for dropdown to open
      await this.waitForTimeout(500);

      // Replace placeholder in selector with actual text
      const finalSelector = optionSelector.replace("{text}", optionText);

      // Wait for option to be visible and click it
      await this.page.waitForSelector(finalSelector, { timeout: 5000 });
      await this.clickElement(finalSelector);

      this.logInfo(`Selected custom dropdown option: ${optionText}`);
    } catch (error) {
      this.logError(`Failed to select from custom dropdown: ${error}`);
      // Take screenshot for debugging
      await this.takeDebugScreenshot(`custom-dropdown-error`);
      throw error;
    }
  }

  async clickAppLauncher(timeout = 5_000): Promise<this> {
    this.logInfo("Clicking the app launcher icon");
    await this.appLauncher.waitFor({ state: "visible", timeout });
    await Promise.all([
      this.page.waitForLoadState("domcontentloaded"),
      this.appLauncher.click(),
    ]);
    return this;
  }

  /**
   * Handle file upload using file chooser
   * @param clickSelector - Selector to click to open file chooser
   * @param filePath - Path to file to upload
   */
  async handleFileUpload(
    clickSelector: string,
    filePath: string
  ): Promise<void> {
    try {
      // Verify file exists
      const fs = require("fs");
      const path = require("path");
      const absPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(absPath)) {
        throw new Error(`File not found: ${absPath}`);
      }

      // Set up file chooser handler
      const fileChooserPromise = this.page.waitForEvent("filechooser");

      // Click to open file chooser
      await this.clickElement(clickSelector);
      this.logInfo("Opened file chooser");

      // Wait for file chooser and set file
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(absPath);
      this.logInfo(`Selected file for upload: ${absPath}`);
    } catch (error) {
      this.logError(`Failed to upload file: ${error}`);
      throw error;
    }
  }

  /**
   * Press a key in a specific locator
   * @param locator - The Playwright Locator for the element
   * @param key - The key to press
   */
  async pressKeyInLocator(locator: any, key: string): Promise<void> {
    try {
      await locator.waitFor({ state: "visible", timeout: 5000 });
      await locator.press(key);
      this.logInfo(`Pressed key ${key} in locator`);
    } catch (error) {
      this.logError(`Failed to press key ${key}: ${error}`);
      throw error;
    }
  }

  async selectDropdownByValue(selector: string, value: string): Promise<void> {
    try {
      await this.page.selectOption(selector, { value: value });
      this.logInfo(
        `Selected dropdown option with value: ${value} from selector: ${selector}`
      );
    } catch (error) {
      this.logError(
        `Failed to select dropdown option by value ${value}: ${error}`
      );
      throw error;
    }
  }

  async takeScreenshot(name: string): Promise<void> {
    const screenshotPath = path.join(
      process.cwd(),
      "reports",
      "screenshots",
      `${name.replace(/[^a-zA-Z0-9]/g, "_")}.png`
    );
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    this.logInfo(`Screenshot saved to ${screenshotPath}`);
  }

  protected logInfo(message: string): void {
    const logMessage = `${new Date().toISOString()} - INFO: ${message}\n`;
    fs.appendFileSync(
      path.join(process.cwd(), "logs", "test.log"),
      logMessage,
      "utf8"
    );
  }

  protected logError(message: string): void {
    const logMessage = `${new Date().toISOString()} - ERROR: ${message}\n`;
    fs.appendFileSync(
      path.join(process.cwd(), "logs", "test.log"),
      logMessage,
      "utf8"
    );
  }

  async waitForTimeout(milliseconds: number): Promise<void> {
    await this.page.waitForTimeout(milliseconds);
    this.logInfo(`Waited for ${milliseconds}ms`);
  }

  /**
   * Handle iframe interactions
   * @param iframeSelector - The selector for the iframe
   * @param buttonSelector - The selector for the button inside iframe
   * @param buttonText - Text to identify the button (optional)
   */
  async handleIframe(
    iframeSelector: string,
    buttonSelector: string,
    buttonText?: string
  ): Promise<boolean> {
    try {
      this.logInfo(`Looking for iframe with selector: ${iframeSelector}`);
      const frameElementHandle = await this.page
        .locator(iframeSelector)
        .first();
      const frame = await frameElementHandle.contentFrame();

      if (frame) {
        this.logInfo("Iframe found, looking for button inside");
        const button = frame.locator(buttonSelector);
        await button.waitFor({ state: "visible", timeout: 5000 });
        await button.scrollIntoViewIfNeeded();
        await button.click();
        this.logInfo(`Button ${buttonText || "clicked"} in iframe`);
        return true;
      } else {
        this.logInfo("No iframe found");
        return false;
      }
    } catch (error) {
      this.logError(`Error handling iframe: ${error}`);
      return false;
    }
  }

  async clickElementByXPath(xpath: string, retries: number = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        const element = this.page.locator(xpath);
        await element.waitFor({ state: "visible", timeout: 10000 });
        await element.click();
        this.logInfo(`Clicked element: ${xpath}`);
        return;
      } catch (error) {
        if (i === retries - 1) {
          this.logError(
            `Failed to click element after ${retries} retries: ${xpath}`
          );
          throw error;
        }
        await this.waitForTimeout(1000);
      }
    }
  }

  async getTextByXPath(xpath: string): Promise<string> {
    try {
      const element = this.page.locator(xpath);
      await element.waitFor({ state: "visible", timeout: 5000 });
      const text = (await element.textContent()) || "";
      this.logInfo(`Got text from ${xpath}: ${text}`);
      return text.trim();
    } catch (error) {
      this.logError(`Failed to get text from ${xpath}: ${error}`);
      throw error;
    }
  }

  async fillFieldByXPath(xpath: string, value: string): Promise<void> {
    try {
      const element = this.page.locator(xpath);
      await element.waitFor({ state: "visible", timeout: 5000 });
      await element.fill(value);
      this.logInfo(`Filled field ${xpath} with value: ${value}`);
    } catch (error) {
      this.logError(`Failed to fill field ${xpath}: ${error}`);
      throw error;
    }
  }

  async takeDebugScreenshot(baseName: string): Promise<void> {
    try {
      const screenshotPath = `debug-${baseName}-${Date.now()}.png`;
      await this.page.screenshot({ path: screenshotPath });
      this.logInfo(`Debug screenshot saved to ${screenshotPath}`);
    } catch (error) {
      this.logError(`Failed to take debug screenshot: ${error}`);
    }
  }

  async waitForSelectorAndClick(
    selector: string,
    timeout: number = 5000
  ): Promise<void> {
    try {
      await this.page.waitForSelector(selector, { timeout });
      await this.page.click(selector);
      this.logInfo(
        `Waited for and clicked on element with selector: ${selector}`
      );
    } catch (error) {
      this.logError(
        `Failed to wait for and click selector ${selector}: ${error}`
      );
      throw error;
    }
  }

  async checkAllMatchingCheckboxes(selector: string): Promise<number> {
    try {
      const checkboxes = await this.page.$$(selector);
      for (const checkbox of checkboxes) {
        await checkbox.check();
      }
      this.logInfo(
        `Checked ${checkboxes.length} checkboxes matching selector: ${selector}`
      );
      return checkboxes.length;
    } catch (error) {
      this.logError(
        `Failed to check checkboxes with selector ${selector}: ${error}`
      );
      throw error;
    }
  }

  async pressKey(key: string): Promise<void> {
    try {
      await this.page.keyboard.press(key);
      this.logInfo(`Pressed key: ${key}`);
    } catch (error) {
      this.logError(`Failed to press key ${key}: ${error}`);
      throw error;
    }
  }

  /**
   * Handle file download
   * @param clickSelector - Selector to click to start download
   * @param downloadDir - Directory to save download to (optional)
   * @returns The path to the downloaded file
   */
  async handleFileDownload(
    clickSelector: string,
    downloadDir?: string
  ): Promise<string> {
    try {
      // Set up download directory if provided
      if (downloadDir) {
        const path = require("path");
        const fs = require("fs");
        const downloadsPath = path.isAbsolute(downloadDir)
          ? downloadDir
          : path.join(process.cwd(), downloadDir);
        if (!fs.existsSync(downloadsPath)) {
          fs.mkdirSync(downloadsPath, { recursive: true });
        }
      }

      // Set up download handler
      const downloadPromise = this.page.waitForEvent("download");

      // Click to initiate download
      await this.clickElement(clickSelector);
      this.logInfo("Clicked download button");

      // Wait for download to start
      const download = await downloadPromise;
      this.logInfo(`Download started: ${download.suggestedFilename()}`);

      // Save the file to the specified directory or default downloads
      const savePath = downloadDir
        ? require("path").join(downloadDir, download.suggestedFilename())
        : download.suggestedFilename();

      await download.saveAs(savePath);
      this.logInfo(`File downloaded to: ${savePath}`);

      return savePath;
    } catch (error) {
      this.logError(`Error during download: ${error}`);
      throw error;
    }
  }

  /**
   * Fill a form field using Playwright Locator
   * @param locator - The Playwright Locator for the form field
   * @param value - The value to fill in
   */
  async fillLocator(locator: any, value: string): Promise<void> {
    try {
      await locator.waitFor({ state: "visible", timeout: 5000 });
      await locator.fill(value);
      this.logInfo(`Filled field with value: ${value}`);
    } catch (error) {
      this.logError(`Failed to fill field: ${error}`);
      throw error;
    }
  }

  async clickLocator(locator: any): Promise<void> {
    try {
      await locator.waitFor({ state: "visible", timeout: 5000 });
      await locator.click();
      this.logInfo(`Clicked on element using locator`);
    } catch (error) {
      this.logError(`Failed to click element: ${error}`);
      throw error;
    }
  }
}
