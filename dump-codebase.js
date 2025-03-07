const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// Output file path
const OUTPUT_FILE = 'codebase-dump.txt';

// Function to get all git-tracked files (automatically respects .gitignore)
function getTrackedFiles() {
  try {
    // Get all files tracked by git
    const gitLsOutput = execSync('git ls-files', { encoding: 'utf-8' });
    return gitLsOutput.split('\n').filter(Boolean);
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

// Custom filter function to exclude certain files
function shouldIncludeFile(filePath) {
  // Skip package-lock.json files
  if (filePath.endsWith('package-lock.json')) return false;
  
  // Skip binary files
  if (isBinaryFile(filePath)) return false;
  
  return true;
}

// Function to create section header for a file
function createSectionHeader(filePath) {
  const separator = '='.repeat(80);
  return `\n${separator}\n${filePath}\n${separator}\n\n`;
}

// Main function to dump the codebase
async function dumpCodebase() {
  try {
    // Get all git-tracked files
    const files = getTrackedFiles();
    
    // Create a write stream to the output file
    const writeStream = fs.createWriteStream(OUTPUT_FILE);
    
    // Add a header to the file
    const now = new Date();
    writeStream.write(`# Dreamlands Codebase Dump\n`);
    writeStream.write(`# Generated on: ${now.toISOString()}\n\n`);
    
    // Sort files by directory structure for better organization
    files.sort();
    
    // Process each file
    let fileCount = 0;
    let skippedCount = 0;
    
    for (const filePath of files) {
      if (!shouldIncludeFile(filePath)) {
        console.log(`Skipping file: ${filePath}`);
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
    
    console.log(`\nCodebase dump complete!`);
    console.log(`- Files included: ${fileCount}`);
    console.log(`- Files skipped: ${skippedCount}`);
    console.log(`- Output file: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('Error dumping codebase:', error);
  }
}

// Run the function
dumpCodebase();