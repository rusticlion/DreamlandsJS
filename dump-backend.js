const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Output file path
const OUTPUT_FILE = 'backend-codebase-dump.txt';

// Patterns to include in the backend dump
const BACKEND_PATTERNS = [
  'server/**/*',
  '.env*'
];

// Patterns to explicitly exclude
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/package-lock.json'
];

// Function to get files matching our patterns
function getFilteredFiles() {
  try {
    // Get all files tracked by git
    const gitLsOutput = execSync('git ls-files', { encoding: 'utf-8' });
    const allFiles = gitLsOutput.split('\n').filter(Boolean);
    
    // Filter files based on patterns
    return allFiles.filter(file => {
      // First check if file should be excluded
      if (EXCLUDE_PATTERNS.some(pattern => {
        if (pattern.endsWith('/**')) {
          const dir = pattern.slice(0, -3);
          return file.startsWith(dir);
        } else if (pattern.startsWith('**/')) {
          const suffix = pattern.slice(3);
          return file.endsWith(suffix) || file.includes('/' + suffix);
        } else {
          return file === pattern;
        }
      })) {
        return false;
      }
      
      // Then check if file should be included
      return BACKEND_PATTERNS.some(pattern => {
        if (pattern.endsWith('/**/*')) {
          const dir = pattern.slice(0, -5);
          return file.startsWith(dir);
        } else if (pattern.startsWith('**/')) {
          const suffix = pattern.slice(3);
          return file.endsWith(suffix) || file.includes('/' + suffix);
        } else if (pattern.startsWith('*.')) {
          const ext = pattern.slice(1);
          return file.endsWith(ext);
        } else {
          return file === pattern || file.startsWith(pattern.replace('/**/*', '/'));
        }
      });
    });
  } catch (error) {
    console.error('Error getting git-tracked files:', error.message);
    return [];
  }
}

// Function to check if a file is binary
function isBinaryFile(filePath) {
  try {
    // Read the first 4KB of the file to check for binary content
    const buffer = Buffer.alloc(4096);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);
    
    // Check for null bytes or non-printable characters
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0 || (buffer[i] < 7 && buffer[i] !== 9 && buffer[i] !== 10 && buffer[i] !== 13)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking if ${filePath} is binary:`, error.message);
    return true; // Assume binary on error
  }
}

// Function to create section header for a file
function createSectionHeader(filePath) {
  const separator = '='.repeat(80);
  return `\n${separator}\n${filePath}\n${separator}\n\n`;
}

// Function to add project context information
function addProjectContext(writeStream) {
  writeStream.write(`# Project Context\n\n`);
  writeStream.write(`This is the backend code for the "Dreamlands" game, a retro-style RPG built with Node.js and Express.\n\n`);
  writeStream.write(`The backend provides:\n`);
  writeStream.write(`- API endpoints for game state persistence\n`);
  writeStream.write(`- Player message system\n`);
  writeStream.write(`- MongoDB integration for data storage\n\n`);
  
  // Add deployment information if available
  try {
    if (fs.existsSync('DEPLOYMENT.md')) {
      const deploymentInfo = fs.readFileSync('DEPLOYMENT.md', 'utf-8');
      writeStream.write(`## Deployment Information\n\n`);
      writeStream.write(deploymentInfo);
      writeStream.write(`\n\n`);
    }
  } catch (error) {
    console.error('Error adding deployment info:', error.message);
  }
}

// Main function to dump the backend codebase
async function dumpBackendCodebase() {
  try {
    // Get filtered files
    const files = getFilteredFiles();
    
    // Create a write stream to the output file
    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    
    // Add a header to the file
    const now = new Date();
    writeStream.write(`# Dreamlands Backend Codebase Dump\n`);
    writeStream.write(`# Generated on: ${now.toISOString()}\n\n`);
    
    // Add project context
    addProjectContext(writeStream);
    
    // Write a table of contents
    writeStream.write(`# Table of Contents\n\n`);
    files.forEach((file, index) => {
      writeStream.write(`${index + 1}. ${file}\n`);
    });
    writeStream.write(`\n\n`);
    
    // Sort files by directory structure for better organization
    files.sort();
    
    // Process each file
    let fileCount = 0;
    let skippedCount = 0;
    
    for (const filePath of files) {
      // Skip binary files
      if (isBinaryFile(filePath)) {
        console.log(`Skipping binary file: ${filePath}`);
        skippedCount++;
        continue;
      }
      
      try {
        // Read file content
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Write section header and file content
        writeStream.write(createSectionHeader(filePath));
        writeStream.write(content);
        writeStream.write('\n');
        
        console.log(`Added file: ${filePath}`);
        fileCount++;
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        skippedCount++;
      }
    }
    
    // Close the write stream
    writeStream.end();
    
    console.log(`\nBackend codebase dump complete!`);
    console.log(`- Files included: ${fileCount}`);
    console.log(`- Files skipped: ${skippedCount}`);
    console.log(`- Output file: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('Error dumping codebase:', error);
  }
}

// Run the function
dumpBackendCodebase();