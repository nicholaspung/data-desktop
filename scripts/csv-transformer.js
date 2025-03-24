// csv-transformer.js
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

/**
 * Transforms CSV data from vertical format to horizontal format
 * @param {string} inputFilePath Path to the input CSV file with vertical data
 * @param {string} outputFilePath Path where the output CSV file should be saved
 * @param {Object} options Additional options for the transformation
 */
function transformCSV(inputFilePath, outputFilePath, options = {}) {
  try {
    // Read the input file
    const fileContent = fs.readFileSync(inputFilePath, "utf8");

    // Parse the CSV content
    const records = parse(fileContent, {
      columns: false,
      skip_empty_lines: true,
      ...options.parseOptions,
    });

    if (records.length === 0) {
      console.error("No data found in the input file");
      return;
    }

    // Determine if data has both headers and values or just headers
    const hasValues = records.some((row) => row.length > 1);

    let headers = [];
    let data = [];

    if (hasValues) {
      // Format: [["field1", "value1"], ["field2", "value2"], ...]
      headers = records.map((row) => row[0]);

      // Transpose the data
      // For each row, collect the values (starting from index 1)
      const values = records.map((row) => row.slice(1));

      // Get the maximum number of values in any row
      const maxValues = Math.max(...values.map((row) => row.length));

      // Create a row for each data point
      for (let i = 0; i < maxValues; i++) {
        const row = [];
        for (let j = 0; j < values.length; j++) {
          // Use the value if it exists, otherwise use empty string
          row.push(values[j][i] !== undefined ? values[j][i] : "");
        }
        data.push(row);
      }
    } else {
      // Format: [["field1"], ["field2"], ...] - just headers, no values
      headers = records.map((row) => row[0]);
      // No data rows
    }

    // Prepare output data
    const outputData = [headers, ...data];

    // Convert to CSV string
    const outputContent = stringify(outputData, {
      delimiter: options.delimiter || "\t",
      header: false,
      ...options.stringifyOptions,
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the output file
    fs.writeFileSync(outputFilePath, outputContent);

    console.log(`CSV transformation completed successfully!`);
    console.log(`Output file: ${outputFilePath}`);
    console.log(`Headers: ${headers.length}`);
    console.log(`Data rows: ${data.length}`);
  } catch (error) {
    console.error("Error transforming CSV:", error);
    process.exit(1);
  }
}

// Process command line arguments
function processArgs() {
  const args = process.argv.slice(2);
  const options = {
    delimiter: "\t",
    parseOptions: {},
    stringifyOptions: {},
  };

  // Display help if requested
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
CSV Transformer - Convert vertical CSV format to horizontal format

Usage:
  node csv-transformer.js [options] <input-file> [output-file]

Options:
  --delimiter=<char>  Specify the delimiter for the output file (default: tab)
  --comma            Use comma as delimiter (shorthand for --delimiter=,)
  --help, -h         Show this help message

Arguments:
  input-file         Path to the input CSV file (required)
  output-file        Path to the output CSV file (optional, defaults to input-file-transformed.csv)

Examples:
  node csv-transformer.js input.csv
  node csv-transformer.js input.csv output.csv
  node csv-transformer.js --delimiter=, input.csv
  node csv-transformer.js --comma input.csv
    `);
    process.exit(0);
  }

  // Process options
  const fileArgs = [];
  for (const arg of args) {
    if (arg.startsWith("--delimiter=")) {
      options.delimiter = arg.split("=")[1];
    } else if (arg === "--comma") {
      options.delimiter = ",";
    } else if (!arg.startsWith("-")) {
      fileArgs.push(arg);
    }
  }

  // Validate input file
  if (fileArgs.length < 1) {
    console.error("Error: Input file is required");
    console.log("Use --help or -h for usage information");
    process.exit(1);
  }

  const inputFile = fileArgs[0];

  // Determine output file
  let outputFile;
  if (fileArgs.length >= 2) {
    outputFile = fileArgs[1];
  } else {
    // Generate output filename based on input file
    const inputExt = path.extname(inputFile);
    const inputBasename = path.basename(inputFile, inputExt);
    const inputDir = path.dirname(inputFile);
    outputFile = path.join(inputDir, `${inputBasename}-transformed${inputExt}`);
  }

  return { inputFile, outputFile, options };
}

// Main execution
const { inputFile, outputFile, options } = processArgs();
transformCSV(inputFile, outputFile, options);
