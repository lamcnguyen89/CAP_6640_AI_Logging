const istanbulReports = require('istanbul-reports');
const { createCoverageMap } = require('istanbul-lib-coverage');
const { createContext } = require('istanbul-lib-report');
const fs = require('fs');

// Customize Handlebars to allow prototype properties access
require('handlebars').compile = function(template, options = {}) {
  options.allowProtoPropertiesByDefault = true;
  options.allowProtoMethodsByDefault = true;
  return require('handlebars').compile(template, options);
};

module.exports = (coverageMap) => {
  const map = createCoverageMap(coverageMap);
  const context = createContext({
    dir: 'coverage', // Directory to output the report
    coverageMap: map
  });

  // Generate HTML report with custom Handlebars runtime options
  const report = istanbulReports.create('html');
  report.execute(context);
};
