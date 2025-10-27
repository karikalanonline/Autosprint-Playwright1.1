module.exports = {
  default: {
    paths: ["src/features/*.feature"],
    require: [
      "src/step_definitions/**/*.ts",
      "src/support/**/*.ts",
      "src/pages/**/*.ts",
      "dotenv/config",
    ],
    requireModule: ["ts-node/register"],
    format: [
      "@cucumber/pretty-formatter",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json",
    ],
    formatOptions: { snippetInterface: "async-await" },
    publishQuiet: true,
    timeout: 60000, // Increased timeout to 60 seconds
  },
};
