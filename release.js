// release.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const VERSION_FILE_PATH = path.join(
  __dirname,
  "frontend",
  "src",
  "lib",
  "version.ts"
);

function getCurrentVersion() {
  try {
    const fileContent = fs.readFileSync(VERSION_FILE_PATH, "utf8");
    const versionMatch = fileContent.match(
      /VERSION_NUMBER\s*=\s*["']([0-9]+\.[0-9]+\.[0-9]+)["']/
    );

    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }

    console.error("Could not parse version number from file.");
    process.exit(1);
  } catch (err) {
    console.error(`Error reading version file: ${err.message}`);
    process.exit(1);
  }
}

function incrementVersion(version, increment) {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (increment) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      return version;
  }
}

function updateVersionFile(newVersion) {
  try {
    let fileContent = fs.readFileSync(VERSION_FILE_PATH, "utf8");
    fileContent = fileContent.replace(
      /(VERSION_NUMBER\s*=\s*["'])([0-9]+\.[0-9]+\.[0-9]+)(["'])/,
      `$1${newVersion}$3`
    );

    fs.writeFileSync(VERSION_FILE_PATH, fileContent, "utf8");
    console.log(`Version updated to ${newVersion} in ${VERSION_FILE_PATH}`);
  } catch (err) {
    console.error(`Error updating version file: ${err.message}`);
    process.exit(1);
  }
}

async function createGitTag(version) {
  try {
    // Check if tag already exists
    let tagExists = false;
    const tagCheck = execSync(`git tag -l v${version}`, { stdio: "pipe" })
      .toString()
      .trim();
    if (tagCheck === `v${version}`) {
      tagExists = true;
    }

    if (tagExists) {
      console.log(`\nTag v${version} already exists.`);
      console.log("Options:");
      console.log("1. Force update the tag (delete and recreate)");
      console.log(
        "2. Delete the existing tag and exit (you can then run a different version)"
      );
      console.log("3. Keep existing tag and commit version change only");

      const tagOption = await new Promise((resolve) => {
        rl.question("Choose option (1-3): ", (answer) => {
          resolve(answer.trim());
        });
      });

      if (tagOption === "1") {
        execSync(`git tag -d v${version}`, { stdio: "inherit" });
        console.log(`\nDeleted existing tag v${version}.`);
        // Will recreate tag later
        tagExists = false;
      } else if (tagOption === "2") {
        execSync(`git tag -d v${version}`, { stdio: "inherit" });
        console.log(`\nDeleted existing tag v${version}.`);
        console.log(
          "Exiting. You can now run the script again with a new version."
        );
        rl.close();
        return false; // Signal to exit early
      } else {
        console.log(
          `\nKeeping existing tag. Version change will be committed without creating a new tag.`
        );
      }
    }

    // Commit the version change
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "Bump version to ${version}"`, {
      stdio: "inherit",
    });

    // Create the tag if needed
    if (!tagExists) {
      execSync(`git tag v${version}`, { stdio: "inherit" });
      console.log(`\nTag v${version} created.`);
    }

    console.log("\nPush changes and tag to remote? (y/n)");
    const shouldPushPrompt = await new Promise((resolve) => {
      rl.question("", (answer) => {
        resolve(answer.toLowerCase() === "y");
      });
    });

    if (shouldPushPrompt) {
      execSync("git push", { stdio: "inherit" });
      if (!tagExists) {
        execSync(`git push origin v${version}`, { stdio: "inherit" });
        console.log(`\nChanges and tag v${version} pushed to remote.`);
        console.log(
          "\nGitHub Actions workflow will start building the release."
        );
      } else {
        console.log(`\nChanges pushed to remote. No new tag was pushed.`);
      }
    } else {
      console.log("\nRemember to push changes and tag manually:");
      console.log("  git push");
      if (!tagExists) {
        console.log(`  git push origin v${version}`);
      }
    }

    return true; // Continue execution
  } catch (err) {
    console.error(`Error during Git operations: ${err.message}`);
    process.exit(1);
  }
}

async function promptForIncrementType() {
  return new Promise((resolve) => {
    rl.question(
      "Choose version increment type:\n1. Patch (0.0.X)\n2. Minor (0.X.0)\n3. Major (X.0.0)\n4. Custom\nSelect (1-4): ",
      (answer) => {
        switch (answer.trim()) {
          case "1":
            resolve("patch");
            break;
          case "2":
            resolve("minor");
            break;
          case "3":
            resolve("major");
            break;
          case "4":
            rl.question(
              "Enter custom version (format: X.Y.Z): ",
              (customVersion) => {
                if (/^\d+\.\d+\.\d+$/.test(customVersion)) {
                  resolve(customVersion);
                } else {
                  console.error(
                    "Invalid version format. Please use X.Y.Z format with numbers."
                  );
                  process.exit(1);
                }
              }
            );
            break;
          default:
            console.error("Invalid selection");
            process.exit(1);
        }
      }
    );
  });
}

async function main() {
  try {
    const currentVersion = getCurrentVersion();
    console.log(`Current version: ${currentVersion}`);

    const incrementType = await promptForIncrementType();

    let newVersion;
    if (["patch", "minor", "major"].includes(incrementType)) {
      newVersion = incrementVersion(currentVersion, incrementType);
    } else {
      newVersion = incrementType; // Custom version
    }

    console.log(`\nNew version will be: ${newVersion}`);

    const proceed = await new Promise((resolve) => {
      rl.question("\nProceed with this version? (y/n): ", (answer) => {
        resolve(answer.toLowerCase() === "y");
      });
    });

    if (proceed) {
      updateVersionFile(newVersion);
      const shouldContinue = await createGitTag(newVersion);
      if (!shouldContinue) {
        // Early exit was requested (user chose option 2)
        process.exit(0);
      }
    } else {
      console.log("Release cancelled.");
    }

    rl.close();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    rl.close();
    process.exit(1);
  }
}

main();
