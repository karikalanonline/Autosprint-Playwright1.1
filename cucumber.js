module.exports = {
  default: {
    //paths: ["src/features/*.feature"], // or "src/features/**/*.feature" if you have nested dirs
    paths: [],
    require: [
      "src/step_definitions/**/*.ts",
      "src/support/**/*.ts",
      "src/pages/**/*.ts",
      "dotenv/config",
    ],
    requireModule: [
      "ts-node/register",
      "tsconfig-paths/register", // <-- enables @pages/*, @support/*, etc.
    ],
    format: [
      "@cucumber/pretty-formatter",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json",
    ],
    formatOptions: { snippetInterface: "async-await" },
    timeout: 60000,
  },
};
