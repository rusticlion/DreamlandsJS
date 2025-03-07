const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to estimate token count for a string
// This is a simplified estimation based on GPT tokenization rules
function estimateTokenCount(text) {
  // A rough estimate for English text (4 characters ≈ 1 token)
  // This is an approximation - tiktoken would give exact counts
  const charCount = text.length;
  
  // Special handling for code which tends to have more tokens per character
  // due to lots of special characters and short tokens
  // Adjust 3.5 to be more conservative for code
  return Math.ceil(charCount / 3.5);
}

// Patterns to exclude from analysis
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.cache/**',
  '**/dist/**',
  '**/package-lock.json'
];

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

// Function to get all tracked files
function getTrackedFiles() {
  try {
    // Get all files tracked by git
    const gitLsOutput = execSync('git ls-files', { encoding: 'utf-8' });
    const allFiles = gitLsOutput.split('\n').filter(Boolean);
    
    // Filter files based on exclude patterns
    return allFiles.filter(file => {
      return !EXCLUDE_PATTERNS.some(pattern => {
        if (pattern.endsWith('/**')) {
          const dir = pattern.slice(0, -3);
          return file.startsWith(dir);
        } else if (pattern.startsWith('**/')) {
          const suffix = pattern.slice(3);
          return file.endsWith(suffix) || file.includes('/' + suffix);
        } else {
          return file === pattern;
        }
      });
    });
  } catch (error) {
    console.error('Error getting git-tracked files:', error.message);
    return [];
  }
}

// Function to categorize files
function categorizeFile(filePath) {
  if (filePath.startsWith('server/')) {
    return 'backend';
  } else if (filePath.startsWith('src/')) {
    return 'frontend-src';
  } else if (filePath.startsWith('public/')) {
    return 'frontend-public';
  } else if (filePath.startsWith('Tickets/')) {
    return 'documentation';
  } else if (['.md', '.txt'].some(ext => filePath.endsWith(ext))) {
    return 'documentation';
  } else {
    return 'other';
  }
}

// Main function to analyze file tokens
async function analyzeTokenCounts() {
  console.log('Analyzing token counts in codebase...\n');
  
  try {
    // Get filtered files
    const files = getTrackedFiles();
    
    // Initialize counters
    const categories = {
      'frontend-src': { files: 0, tokens: 0, bytes: 0 },
      'frontend-public': { files: 0, tokens: 0, bytes: 0 },
      'backend': { files: 0, tokens: 0, bytes: 0 },
      'documentation': { files: 0, tokens: 0, bytes: 0 },
      'other': { files: 0, tokens: 0, bytes: 0 }
    };
    
    // Arrays to store individual file reports
    const fileReports = [];
    let skippedCount = 0;
    
    // Process each file
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
        
        // Calculate token count
        const tokens = estimateTokenCount(content);
        const bytes = Buffer.byteLength(content, 'utf-8');
        
        // Categorize the file
        const category = categorizeFile(filePath);
        
        // Update category counts
        categories[category].files++;
        categories[category].tokens += tokens;
        categories[category].bytes += bytes;
        
        // Store individual file report
        fileReports.push({
          path: filePath,
          category,
          tokens,
          bytes,
          bytesPerToken: (bytes / tokens).toFixed(2)
        });
        
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        skippedCount++;
      }
    }
    
    // Sort file reports by token count (descending)
    fileReports.sort((a, b) => b.tokens - a.tokens);
    
    // Print summary by category
    console.log('='.repeat(80));
    console.log('SUMMARY BY CATEGORY');
    console.log('='.repeat(80));
    
    let totalTokens = 0;
    let totalFiles = 0;
    let totalBytes = 0;
    
    Object.entries(categories).forEach(([category, stats]) => {
      totalTokens += stats.tokens;
      totalFiles += stats.files;
      totalBytes += stats.bytes;
      
      if (stats.files > 0) {
        console.log(`${category}:`);
        console.log(`  Files: ${stats.files}`);
        console.log(`  Tokens: ${stats.tokens.toLocaleString()} (~${Math.round(stats.tokens/1000)}K)`);
        console.log(`  Size: ${(stats.bytes / 1024).toFixed(2)} KB`);
        console.log(`  Avg tokens per file: ${Math.round(stats.tokens / stats.files).toLocaleString()}`);
        console.log('');
      }
    });
    
    // Print total summary
    console.log('='.repeat(80));
    console.log('TOTAL CODEBASE:');
    console.log(`  Files: ${totalFiles}`);
    console.log(`  Tokens: ${totalTokens.toLocaleString()} (~${Math.round(totalTokens/1000)}K)`);
    console.log(`  Size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Files skipped: ${skippedCount}`);
    console.log('='.repeat(80));
    
    // Print top files by token count
    console.log('\nTOP 10 FILES BY TOKEN COUNT:');
    console.log('='.repeat(80));
    fileReports.slice(0, 10).forEach((file, index) => {
      console.log(`${index + 1}. ${file.path}`);
      console.log(`   Tokens: ${file.tokens.toLocaleString()}`);
      console.log(`   Size: ${(file.bytes / 1024).toFixed(2)} KB`);
      console.log(`   Category: ${file.category}`);
      console.log('');
    });
    
    // Print tokenization estimates for LLM context limits
    console.log('='.repeat(80));
    console.log('LLM CONTEXT ESTIMATES:');
    console.log('='.repeat(80));
    
    const llmContexts = [
      { name: 'GPT-3.5 (4K)', limit: 4000 },
      { name: 'Claude 2 (100K)', limit: 100000 },
      { name: 'GPT-4 (8K)', limit: 8000 },
      { name: 'GPT-4 (32K)', limit: 32000 },
      { name: 'Claude Opus (200K)', limit: 200000 }
    ];
    
    llmContexts.forEach(llm => {
      const percentOfContext = ((totalTokens / llm.limit) * 100).toFixed(2);
      console.log(`${llm.name}: ${percentOfContext}% of context window`);
      
      // Which categories fit within this context limit
      const fittingCategories = Object.entries(categories)
        .filter(([_, stats]) => stats.tokens <= llm.limit)
        .map(([category, stats]) => `${category} (${Math.round(stats.tokens/1000)}K tokens)`);
      
      if (fittingCategories.length > 0) {
        console.log(`  Categories that fit: ${fittingCategories.join(', ')}`);
      } else {
        console.log('  No individual category fits within this context limit');
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error analyzing token counts:', error);
  }
}

// Run the function
analyzeTokenCounts();