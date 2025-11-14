#!/usr/bin/env node

/**
 * KOMMENTIFY API KEY SETUP SCRIPT
 *
 * This script helps you configure your OpenAI API key for Kommentify.
 * Run this after building the extension:
 *
 * node setup-api-key.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║                                                        ║');
console.log('║         🚀 KOMMENTIFY API KEY SETUP                   ║');
console.log('║                                                        ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('This script will configure your OpenAI API key for Kommentify.\n');

rl.question('Enter your OpenAI API key: ', (apiKey) => {
  if (!apiKey.trim()) {
    console.log('\n❌ No API key provided. Setup cancelled.\n');
    console.log('Get your API key from: https://platform.openai.com/api-keys\n');
    rl.close();
    return;
  }

  if (!apiKey.startsWith('sk-')) {
    console.log('\n❌ Invalid API key format. OpenAI keys start with "sk-"\n');
    rl.close();
    return;
  }

  setupAPIKey(apiKey.trim());
});

function setupAPIKey(apiKey) {
  console.log('\n⏳ Setting up your API key...\n');

  try {
    // Create config file for the extension
    const configContent = `/**
 * AUTO-GENERATED CONFIGURATION
 * This file was created by setup-api-key.js
 * DO NOT COMMIT THIS FILE TO GIT!
 */

export const OPENAI_API_KEY = '${apiKey}';
`;

    const configPath = path.join(__dirname, 'src', 'config', 'api-key.ts');

    // Ensure config directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, configContent);

    // Update .gitignore to exclude api-key.ts
    const gitignorePath = path.join(__dirname, '.gitignore');
    let gitignoreContent = '';

    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    if (!gitignoreContent.includes('api-key.ts')) {
      gitignoreContent += '\n# OpenAI API Key (auto-generated)\nsrc/config/api-key.ts\n';
      fs.writeFileSync(gitignorePath, gitignoreContent);
    }

    console.log('✅ API key configured successfully!\n');
    console.log('📝 Configuration saved to: src/config/api-key.ts');
    console.log('🔒 Added to .gitignore for security\n');
    console.log('Next steps:');
    console.log('1. Run: npm run build');
    console.log('2. Load the extension in Chrome (chrome://extensions/)');
    console.log('3. Enable Developer Mode and click "Load unpacked"');
    console.log('4. Select the "dist" folder\n');
    console.log('🎉 You\'re ready to use Kommentify!\n');

  } catch (error) {
    console.log('\n❌ Error setting up API key:', error.message);
    console.log('\nPlease try again or manually create the configuration file.\n');
  }

  rl.close();
}
