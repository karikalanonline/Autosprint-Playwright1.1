import fs from 'fs';
import path from 'path';

export interface WorkItemData {
  projectName: string;
  description: string;
  acceptanceCriteria: string;
  customInstructions?: string;
}

export interface TestDataset {
  [key: string]: WorkItemData;
}

export class TestDataReader {
  private static instance: TestDataReader;
  private dataCache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): TestDataReader {
    if (!TestDataReader.instance) {
      TestDataReader.instance = new TestDataReader();
    }
    return TestDataReader.instance;
  }

  /**
   * Load test data from a JSON file
   * @param fileName - Name of the JSON file in test-data directory
   * @returns Parsed JSON data
   */
  public loadTestData(fileName: string): any {
    const cacheKey = fileName;
    
    if (this.dataCache.has(cacheKey)) {
      //console.log(`Using cached data for: ${fileName}`);
      return this.dataCache.get(cacheKey);
    }

    try {
      const dataPath = path.join(process.cwd(), 'test-data', fileName);
      
      if (!fs.existsSync(dataPath)) {
        throw new Error(`Test data file not found: ${dataPath}`);
      }

      const rawData = fs.readFileSync(dataPath, 'utf8');
      const parsedData = JSON.parse(rawData);
      
      this.dataCache.set(cacheKey, parsedData);
      //console.log(`Loaded test data from: ${fileName}`);
      
      return parsedData;
    } catch (error) {
      console.error(`Error loading test data from ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Get work item data by dataset name
   * @param datasetName - Name of the dataset (e.g., 'nonAdoWorkflow')
   * @returns WorkItemData object
   */
  public getWorkItemData(datasetName: string): WorkItemData {
    const workItems: TestDataset = this.loadTestData('work-items.json');
    
    if (!workItems[datasetName]) {
      const availableDatasets = Object.keys(workItems).join(', ');
      throw new Error(`Dataset '${datasetName}' not found. Available datasets: ${availableDatasets}`);
    }

    //console.log(`Retrieved work item data for: ${datasetName}`);
    return workItems[datasetName];
  }

  /**
   * Get all available dataset names
   * @returns Array of dataset names
   */
  public getAvailableDatasets(): string[] {
    const workItems: TestDataset = this.loadTestData('work-items.json');
    return Object.keys(workItems);
  }

  /**
   * Clear the data cache (useful for testing)
   */
  public clearCache(): void {
    this.dataCache.clear();
    //console.log('Test data cache cleared');
  }
}

// Export singleton instance
export const testDataReader = TestDataReader.getInstance();