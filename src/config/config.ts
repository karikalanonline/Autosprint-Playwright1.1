import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const config = {
  // Application URLs
  baseUrl: process.env.BASE_URL || "https://xyzq.deloitte.com",
  // User credentials
  credentials: {
    username: process.env.APP_USERNAME || "admin",
    password: process.env.APP_PASSWORD || "password",
  },
  // Browser configuration
  browser: {
    headless: false, // Force headed mode for UI testing
    slowMo: parseInt(process.env.SLOW_MO || "50"),
    timeout: parseInt(process.env.TIMEOUT || "30000"),
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH || "1280"),
      height: parseInt(process.env.VIEWPORT_HEIGHT || "720"),
    },
  },

  // Test configuration
  test: {
    timeout: parseInt(process.env.TEST_TIMEOUT || "60000"),
  },

  // Test data
  testData: {
    projectName: process.env.PROJECT_NAME || "Test Engagement",
    projectDescription:
      process.env.PROJECT_DESCRIPTION || "Test Project Description",
    clientName: process.env.CLIENT_NAME || "Test Client",
  },
};
export default config;
