#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

// Get command line arguments
const args = process.argv.slice(2);
let inputFile = "";
let outputFile = "";
let skipEmpty = true;
let extractUnits = false; // Changed from includeUnits to extractUnits
let preserveFullName = true; // New flag to keep original name with parentheses
let verbose = false;

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--help" || args[i] === "-h") {
    displayHelp();
    process.exit(0);
  } else if (args[i] === "--include-empty" || args[i] === "-e") {
    skipEmpty = false;
  } else if (args[i] === "--verbose" || args[i] === "-v") {
    verbose = true;
  } else if (args[i] === "--extract-units" || args[i] === "-u") {
    extractUnits = true;
  } else if (args[i] === "--clean-names") {
    preserveFullName = false;
  } else if (args[i] === "--output" || args[i] === "-o") {
    if (i + 1 < args.length) {
      outputFile = args[i + 1];
      i++; // Skip the next argument since we've used it
    }
  } else if (!inputFile) {
    inputFile = args[i];
  }
}

// Check if input file was provided
if (!inputFile) {
  console.error("Error: No input file specified");
  displayHelp();
  process.exit(1);
}

// Determine output file name if not provided
if (!outputFile) {
  outputFile = `${path.parse(inputFile).name}_transformed.csv`;
}

/**
 * Display help information
 */
function displayHelp() {
  console.log(`
Blood Test CSV Transformer
--------------------------
Transforms blood test data from wide format (markers as rows) to long format (one result per row).

Usage: node csv-transformer.js [options] <input-file.csv>

Options:
  -o, --output <file>     Specify output file (default: inputFile_transformed.csv)
  -e, --include-empty     Include rows with empty values (default: skip empty values)
  -u, --extract-units     Extract units from marker names (default: false)
  --clean-names           Remove parentheses from marker names (default: preserve full names)
  -v, --verbose           Show detailed processing information
  -h, --help              Show this help message

Example:
  node csv-transformer.js bloodwork.csv -o transformed.csv
`);
}

// Read the CSV file
try {
  if (verbose) console.log(`Reading file: ${inputFile}`);
  const fileContent = fs.readFileSync(inputFile, "utf8");

  // Parse the CSV
  if (verbose) console.log("Parsing CSV data...");
  Papa.parse(fileContent, {
    header: false,
    skipEmptyLines: true,
    complete: function (results) {
      if (verbose) console.log(`Parsed ${results.data.length} rows`);
      transformData(results.data);
    },
    error: function (error) {
      console.error("Error parsing CSV:", error.message);
      process.exit(1);
    },
  });
} catch (err) {
  console.error(`Error reading file: ${err.message}`);
  process.exit(1);
}

/**
 * Extract unit from marker name if present
 * @param {string} markerName - The marker name possibly containing unit info
 * @returns {Object} Object containing clean name and unit
 */
function extractUnit(markerName) {
  const unitRegex = /\((.*?)\)/;
  const match = markerName.match(unitRegex);

  if (match) {
    // Only remove the unit part if specified
    const cleanName = preserveFullName
      ? markerName
      : markerName.replace(unitRegex, "").trim();
    return {
      name: cleanName,
      unit: match[1],
    };
  }

  return {
    name: markerName,
    unit: "",
  };
}

/**
 * Transform the data from wide to long format
 * @param {Array} data - The parsed CSV data
 */
function transformData(data) {
  // Ensure we have at least a header row and one data row
  if (data.length < 2) {
    console.error(
      "Error: CSV must contain at least a header row and one data row"
    );
    process.exit(1);
  }

  // The first row contains the headers (dates)
  const headers = data[0];
  const markerColumn = headers[0]; // Usually "name" or similar

  // Create the output array with appropriate headers
  let outputHeaders = ["date", "marker_name", "value_text", "value_number"];
  if (extractUnits) {
    outputHeaders.push("unit");
  }

  const outputData = [outputHeaders];

  let totalDataPoints = 0;
  let emptyValues = 0;

  // Process each row (skip header row)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let markerName = row[0];

    // Skip rows with empty marker names
    if (!markerName || markerName.trim() === "") {
      if (verbose) console.log(`Skipping row ${i + 1} - empty marker name`);
      continue;
    }

    // Extract unit information if needed
    let unit = "";
    if (extractUnits) {
      const result = extractUnit(markerName);
      markerName = result.name; // This will keep full name if preserveFullName is true
      unit = result.unit;
    }

    // Process each date column
    for (let j = 1; j < headers.length; j++) {
      const date = headers[j];
      let value = "";

      // Handle case where row might be shorter than headers
      if (j < row.length) {
        value = row[j] ? row[j].trim() : "";
      }

      // Check if we should skip empty values
      if (skipEmpty && value === "") {
        emptyValues++;
        continue;
      }

      // Determine if value is numeric or text
      const valueNumber = parseFloat(value);
      const isNumber = !isNaN(valueNumber) && value.trim() !== "";

      // Create the output row, separating numeric and text values
      let outputRow = [
        date,
        markerName,
        isNumber ? "" : value, // value_text column
        isNumber ? valueNumber : "", // value_number column
      ];

      if (extractUnits) {
        outputRow.push(unit);
      }

      outputData.push(outputRow);
      totalDataPoints++;
    }
  }

  // Convert back to CSV
  const outputContent = Papa.unparse(outputData, {
    delimiter: ",",
    header: true,
  });

  // Write to the output file
  try {
    fs.writeFileSync(outputFile, outputContent);
    console.log(`✅ Transformation complete! Output saved to ${outputFile}`);

    if (verbose) {
      console.log(`📊 Statistics:`);
      console.log(
        `   - Processed ${data.length - 1} markers across ${
          headers.length - 1
        } dates`
      );
      console.log(`   - Generated ${totalDataPoints} data points`);
      console.log(`   - Skipped ${emptyValues} empty values`);
    } else {
      console.log(`📝 Generated ${totalDataPoints} data points`);
    }
  } catch (err) {
    console.error(`Error writing output file: ${err.message}`);
    process.exit(1);
  }
}
