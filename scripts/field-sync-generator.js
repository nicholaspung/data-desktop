// field-sync-generator.js
// This script generates Go field definitions from JavaScript field definitions
// Run this with: node field-sync-generator.js

const fs = require("fs");
const path = require("path");

// Instead of trying to import the module directly, let's read and parse the TypeScript file
function loadFieldDefinitionsFromFile() {
  try {
    // Specify the path to your dexa-definitions.ts file
    const filePath = path.resolve(
      __dirname,
      "../frontend/src/features/field-definitions/dexa-definitions.ts"
    );

    // Read the file content
    const fileContent = fs.readFileSync(filePath, "utf8");

    // A very simple parser to extract the DEXA_FIELD_DEFINITIONS object
    // This is not a full TypeScript parser, but should work for basic cases
    const startMarker = "export const DEXA_FIELD_DEFINITIONS";
    const startIndex = fileContent.indexOf(startMarker);

    if (startIndex === -1) {
      throw new Error("Could not find DEXA_FIELD_DEFINITIONS in the file");
    }

    // Find the opening brace after the constant definition
    const openBraceIndex = fileContent.indexOf("{", startIndex);
    if (openBraceIndex === -1) {
      throw new Error(
        "Could not find the start of the DEXA_FIELD_DEFINITIONS object"
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
      throw new Error(
        "Could not find the end of the DEXA_FIELD_DEFINITIONS object"
      );
    }

    // Extract the object definition as a string
    const objectStr = fileContent.substring(openBraceIndex, endIndex);

    // Convert the string to a JavaScript object using Function constructor
    // This is safer than eval() but still has security implications
    // Only use this for local development scripts, not in production code
    const objectFn = new Function("return " + objectStr);
    return objectFn();
  } catch (error) {
    console.error("Error loading field definitions:", error.message);
    console.log("Falling back to example data...");

    // Provide fallback example data if the import fails
    return {
      id: "dexa",
      name: "DEXA Scan",
      description: "Body composition measurements from DEXA scans",
      fields: [
        {
          key: "date",
          type: "date",
          displayName: "Date",
          description: "Date of the DEXA scan",
          isSearchable: true,
        },
        {
          key: "fasted",
          type: "boolean",
          displayName: "Fasted",
          description: "Whether the scan was taken in a fasted state",
        },
        {
          key: "total_body_fat_percentage",
          type: "percentage",
          displayName: "Body Fat %",
          description: "Total body fat percentage",
          isSearchable: true,
        },
        {
          key: "total_mass_lbs",
          type: "number",
          displayName: "Total Mass",
          unit: "lbs",
          description: "Total body mass",
        },
      ],
    };
  }
}

// Function to convert JS field definition to Go field definition
function convertToGoField(field) {
  // Escape any double quotes in strings
  const displayName = field.displayName.replace(/"/g, '\\"');
  const description = (field.description || "").replace(/"/g, '\\"');
  const unit = field.unit ? field.unit.replace(/"/g, '\\"') : "";

  return `{
    Key:          "${field.key}",
    Type:         database.FieldType${capitalizeFirstLetter(field.type)},
    DisplayName:  "${displayName}",
    Description:  "${description}",
    ${field.unit ? `Unit:         "${unit}",` : ""}
    IsSearchable: ${field.isSearchable || false},
},`;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Generate Go code for default DEXA fields
function generateDEXAFieldsCode() {
  const dexaFieldDefinitions = loadFieldDefinitionsFromFile();

  // Output some debug info
  console.log(
    `Found ${dexaFieldDefinitions.fields.length} fields for DEXA dataset`
  );
  console.log(`First field: ${dexaFieldDefinitions.fields[0]?.key || "none"}`);

  const fields = dexaFieldDefinitions.fields
    .map((field) => convertToGoField(field))
    .join("\n");

  return `// This code is auto-generated from dexa-definitions.ts
// Do not edit manually - run field-sync-generator.js instead
package models

import (
	"myproject/backend/database"
)

// GetDEXAFields returns the field definitions for the DEXA dataset
// Note: Keep these in sync with dexa-definitions.ts in the frontend
func GetDEXAFields() []database.FieldDefinition {
  return []database.FieldDefinition{
    ${fields}
  }
}`;
}

// Generate and save the Go code
function generateAndSaveGoCode() {
  const goCode = generateDEXAFieldsCode();
  const outputFile = "generated-dexa-fields.go";

  fs.writeFileSync(outputFile, goCode);
  console.log(`Go field definitions written to: ${outputFile}`);
  console.log(
    "Copy this code into backend/database/models/dexa_fields.go to ensure field definitions stay in sync"
  );
}

// Run the generator
generateAndSaveGoCode();
