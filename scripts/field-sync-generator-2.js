// field-sync-generator.js
// This script generates Go field definitions from JavaScript field definitions
// Run this with: node field-sync-generator.js

const fs = require("fs");
const path = require("path");

// Parse a TypeScript field definitions file
function loadFieldDefinitionsFromFile(filePath, exportVarName) {
  try {
    // Use absolute path
    const resolvedPath = path.resolve(filePath);
    console.log(`Looking for file at: ${resolvedPath}`);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    // Read the file content
    const fileContent = fs.readFileSync(resolvedPath, "utf8");

    // Find the exported variable
    const startMarker = `export const ${exportVarName}`;
    const startIndex = fileContent.indexOf(startMarker);

    if (startIndex === -1) {
      throw new Error(`Could not find ${exportVarName} in the file`);
    }

    // Find the opening brace after the constant definition
    const openBraceIndex = fileContent.indexOf("{", startIndex);
    if (openBraceIndex === -1) {
      throw new Error(
        `Could not find the start of the ${exportVarName} object`
      );
    }

    // Track braces to find the end of the object
    let braceCount = 1;
    let endIndex = openBraceIndex + 1;

    while (braceCount > 0 && endIndex < fileContent.length) {
      if (fileContent[endIndex] === "{") {
        braceCount++;
      } else if (fileContent[endIndex] === "}") {
        braceCount--;
      }
      endIndex++;
    }

    if (braceCount !== 0) {
      throw new Error(`Could not find the end of the ${exportVarName} object`);
    }

    // Extract the object definition as a string
    const objectStr = fileContent.substring(openBraceIndex, endIndex);

    // Convert the string to a JavaScript object using Function constructor
    const objectFn = new Function("return " + objectStr);
    return objectFn();
  } catch (error) {
    console.error(
      `Error loading field definitions from ${filePath}:`,
      error.message
    );
    throw error;
  }
}

// Function to convert JS field definition to Go field definition, now with relation support
function convertToGoField(field) {
  // Escape any double quotes in strings
  const displayName = field.displayName.replace(/"/g, '\\"');
  const description = (field.description || "").replace(/"/g, '\\"');
  const unit = field.unit ? field.unit.replace(/"/g, '\\"') : "";

  // Start with the common fields
  let goField = `{
    Key:          "${field.key}",
    Type:         database.FieldType${capitalizeFirstLetter(field.type)},
    DisplayName:  "${displayName}",
    Description:  "${description}",
    ${field.unit ? `Unit:         "${unit}",` : ""}
    IsSearchable: ${field.isSearchable || false},`;

  // Add relation fields if present
  if (field.isRelation) {
    goField += `
    IsRelation:     ${field.isRelation || false},`;

    if (field.relatedDataset) {
      goField += `
    RelatedDataset: "${field.relatedDataset}",`;
    }

    if (field.relatedField) {
      goField += `
    RelatedField:   "${field.relatedField}",`;
    }
  }

  // Close the field definition
  goField += `
},`;

  return goField;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Generate Go code for any dataset fields
function generateFieldsCode(
  definitionsFile,
  exportVarName,
  goFuncName,
  packageName = "models"
) {
  try {
    const fieldDefinitions = loadFieldDefinitionsFromFile(
      definitionsFile,
      exportVarName
    );

    // Output some debug info
    console.log(
      `Found ${fieldDefinitions.fields.length} fields for ${exportVarName}`
    );
    console.log(`First field: ${fieldDefinitions.fields[0]?.key || "none"}`);

    const fields = fieldDefinitions.fields
      .map((field) => convertToGoField(field))
      .join("\n");

    return `// This code is auto-generated from ${path.basename(
      definitionsFile
    )}
// Do not edit manually - run field-sync-generator.js instead
package ${packageName}

import (
    "myproject/backend/database"
)

// ${goFuncName} returns the field definitions for the ${
      fieldDefinitions.name
    } dataset
// Note: Keep these in sync with ${path.basename(
      definitionsFile
    )} in the frontend
func ${goFuncName}() []database.FieldDefinition {
    return []database.FieldDefinition{
        ${fields}
    }
}`;
  } catch (error) {
    console.error(`Failed to generate code for ${exportVarName}:`, error);
    return null;
  }
}

// Process a single dataset
function processDataset(
  definitionsFile,
  exportVarName,
  goFuncName,
  outputFileName
) {
  try {
    // Generate the Go code
    const goCode = generateFieldsCode(
      definitionsFile,
      exportVarName,
      goFuncName
    );

    // Only write if we got a valid code
    if (goCode) {
      // Write to file
      fs.writeFileSync(outputFileName, goCode);

      console.log(
        `✅ Go field definitions for ${exportVarName} written to: ${outputFileName}`
      );
      console.log(
        `   Copy this code into backend/database/models/${outputFileName} to ensure field definitions stay in sync`
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Failed to process ${exportVarName}:`, error.message);
    return false;
  }
}

// Main function just processes DEXA fields (simpler for now)
function main() {
  // Get command line arguments
  const args = process.argv.slice(2);

  // Default to just processing DEXA if no args provided
  if (args.length === 0) {
    console.log("No specific datasets specified, processing DEXA fields only");
    processDataset(
      "./frontend/src/features/field-definitions/dexa-definitions.ts",
      "DEXA_FIELD_DEFINITIONS",
      "GetDEXAFields",
      "dexa_fields.go"
    );
    return;
  }

  // Process requested datasets
  for (const dataset of args) {
    switch (dataset.toLowerCase()) {
      case "dexa":
        processDataset(
          "./frontend/src/features/field-definitions/dexa-definitions.ts",
          "DEXA_FIELD_DEFINITIONS",
          "GetDEXAFields",
          "dexa_fields.go"
        );
        break;

      case "bloodwork":
        processDataset(
          "./frontend/src/features/field-definitions/bloodwork-definitions.ts",
          "BLOODWORK_FIELD_DEFINITIONS",
          "GetBloodworkFields",
          "bloodwork_fields.go"
        );
        break;

      case "markers":
        processDataset(
          "./frontend/src/features/field-definitions/bloodwork-definitions.ts",
          "BLOOD_MARKERS_FIELD_DEFINITIONS",
          "GetBloodMarkerFields",
          "blood_marker_fields.go"
        );
        break;

      case "results":
        processDataset(
          "./frontend/src/features/field-definitions/bloodwork-definitions.ts",
          "BLOOD_RESULTS_FIELD_DEFINITIONS",
          "GetBloodResultFields",
          "blood_result_fields.go"
        );
        break;

      case "experiment":
        processDataset(
          "./frontend/src/features/field-definitions/experiment-definitions.ts",
          "EXPERIMENT_FIELD_DEFINITIONS",
          "GetExperimentFields",
          "experiment_fields.go"
        );
        break;

      case "metric":
        processDataset(
          "./frontend/src/features/field-definitions/experiment-definitions.ts",
          "METRIC_FIELD_DEFINITIONS",
          "GetMetricFields",
          "metric_fields.go"
        );
        break;

      case "daily_log":
        processDataset(
          "./frontend/src/features/field-definitions/experiment-definitions.ts",
          "DAILY_LOG_FIELD_DEFINITIONS",
          "GetDailyLogFields",
          "daily_log_fields.go"
        );
        break;

      case "metric_category":
        processDataset(
          "./frontend/src/features/field-definitions/experiment-definitions.ts",
          "METRIC_CATEGORY_FIELD_DEFINITIONS",
          "GetMetricCategoryFields",
          "metric_category_fields.go"
        );
        break;

      case "experiment_metric":
        processDataset(
          "./frontend/src/features/field-definitions/experiment-definitions.ts",
          "EXPERIMENT_METRIC_FIELD_DEFINITIONS",
          "GetExperimentMetricFields",
          "experiment_metric_fields.go"
        );
        break;

      default:
        console.log(`Unknown dataset: ${dataset}`);
    }
  }
}

// Run the generator
main();
