#!/usr/bin/env node

/**
 * Build script to automatically update Docs.tsx with latest README.md content
 * This script runs during the build process to ensure documentation is always up-to-date
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const readmePath = path.join(projectRoot, "docs-source", "README.md");
const docsComponentPath = path.join(projectRoot, "src", "pages", "Docs.tsx");

function updateDocsComponent() {
  try {
    // Check if README.md exists
    if (!fs.existsSync(readmePath)) {
      return;
    }

    // Read the README.md content
    const readmeContent = fs.readFileSync(readmePath, "utf8");

    // Escape only the characters that need escaping in template literals
    // Don't escape $ unless it's actually part of a template expression
    const escapedContent = readmeContent
      .replace(/\\/g, "\\\\") // Escape backslashes first
      .replace(/`/g, "\\`"); // Escape backticks

    // Read the current Docs.tsx file
    let docsComponent = fs.readFileSync(docsComponentPath, "utf8");

    // Check if the file has the expected structure
    if (!docsComponent.includes("const markdownContent =")) {
      return;
    }

    // Create the new markdown content
    const newMarkdownContent = `// Pre-compiled markdown content - this gets bundled during build time
// No runtime fetching needed, eliminating the 403 error
// Auto-updated from public/docs/README.md during build
const markdownContent = \`${escapedContent}\`;`;

    // Replace the existing markdown content
    const updatedComponent = docsComponent.replace(
      /\/\/ Pre-compiled markdown content[\s\S]*?const markdownContent = `[\s\S]*?`;/,
      newMarkdownContent,
    );

    // Check if the replacement was successful
    if (updatedComponent === docsComponent) {
      return;
    }

    // Write the updated component back
    fs.writeFileSync(docsComponentPath, updatedComponent);

    // Successfully updated Docs.tsx with latest README.md content
  } catch (error) {
    console.error("❌ Error updating Docs.tsx:", error.message);
    // Don't exit with error code during build, just log the issue
    if (process.argv.includes("--exit-on-error")) {
      process.exit(1);
    }
  }
}

// Run the update
updateDocsComponent();
