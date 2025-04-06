const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

/**
 * Transforms blood test data from wide format to long format
 * Input format: name, unit, ...dates
 * Output format: date, marker, value_text, value_number
 *
 * @param {string} inputFilePath - Path to the input CSV file
 * @param {string} outputFilePath - Path to save the output CSV file (optional)
 * @returns {string} Path to the output file
 */
function transformBloodTestCSV(inputFilePath, outputFilePath) {
  // If no output path provided, create one based on the input file
  if (!outputFilePath) {
    const inputDir = path.dirname(inputFilePath);
    const inputBasename = path.basename(
      inputFilePath,
      path.extname(inputFilePath)
    );
    outputFilePath = path.join(inputDir, `${inputBasename}_transformed.csv`);
  }
  // Read the input file
  const inputCSV = fs.readFileSync(inputFilePath, "utf8");

  console.log(`File loaded successfully: ${inputFilePath}`);

  // Parse the CSV
  Papa.parse(inputCSV, {
    header: true,
    skipEmptyLines: true,
    transformHeader: function (header) {
      // Normalize headers to lowercase for consistency
      return header.toLowerCase().trim();
    },
    complete: function (results) {
      if (results.errors && results.errors.length > 0) {
        console.error("CSV parsing errors:", results.errors);
        return;
      }

      console.log("CSV parsed successfully");

      // Extract data
      const data = results.data;
      const headers = results.meta.fields;

      console.log("Headers found:", headers);

      // First two columns are expected to be 'name' and 'unit'
      const dateColumns = headers.slice(2);

      console.log(`Found ${dateColumns.length} date columns:`, dateColumns);

      // Initialize the transformed data array
      const transformedData = [];

      // Process each row (marker)
      data.forEach((row) => {
        // Since we normalized headers to lowercase, we can be sure these are correct
        const testName = row.name || "";
        const testUnit = row.unit || "";

        // Create the marker name with unit - ensure we only add parentheses if there's a unit
        const markerName =
          testUnit && testUnit.trim() !== ""
            ? `${testName} (${testUnit})`
            : testName;

        // Debug logging to help diagnose issues
        // console.log(`Processing marker: name=${testName}, unit=${testUnit}, combined=${markerName}`);

        // Process each date column
        dateColumns.forEach((dateColumn) => {
          const value = row[dateColumn];

          // Skip empty values
          if (value === undefined || value === null || value === "") {
            return;
          }

          // Determine if the value is a number or text
          const isNumber = !isNaN(parseFloat(value)) && isFinite(value);

          // Create a record for this date and marker
          const record = {
            date: dateColumn,
            marker: markerName,
            value_text: isNumber ? "" : value,
            value_number: isNumber ? parseFloat(value) : "",
          };

          transformedData.push(record);
        });
      });

      // Convert the transformed data back to CSV
      const outputCSV = Papa.unparse(transformedData);

      // Write to the output file
      fs.writeFileSync(outputFilePath, outputCSV);

      console.log(`Transformation complete! Output saved to ${outputFilePath}`);
      console.log(
        `Processed ${data.length} markers across ${dateColumns.length} dates.`
      );
      console.log(`Generated ${transformedData.length} records.`);
    },
  });

  return outputFilePath;
}

// Check if this script is being run directly
if (require.main === module) {
  // Process command line arguments
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error(
      "Usage: node bloodtest-csv-transformer.js <input-file> [output-file]"
    );
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args.length >= 2 ? args[1] : null;

  console.log(`Transforming blood test data from ${inputFile}...`);
  const resultPath = transformBloodTestCSV(inputFile, outputFile);
}

// Export the function for use in other scripts
module.exports = { transformBloodTestCSV };
