# 🔧 Quick Start Guide

## Prerequisites

- Node.js 16+ and npm
- Chrome or Edge browser

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages (React, TypeScript, Webpack, etc.)

### 2. Configure OpenAI API Key

**Get your API key first:**
- Visit https://platform.openai.com/api-keys
- Create a new API key
- Copy it (starts with `sk-...`)

**Then run setup:**
```bash
npm run setup
```

Paste your API key when prompted. It will be saved securely.

**Alternative:** Edit `src/config/api-key.ts` and add your key there.

### 3. Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 4. Load in Chrome/Edge

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from this project
5. The extension should now appear in your list

### 5. Pin the Extension

- Click the puzzle icon in your browser toolbar
- Find "Kommentify" and click the pin icon
- The extension icon will now be visible

## Quick Test

1. **Click the extension icon** to open the popup
2. **Click "✨ Create Lead Magnet Post"** to test AI
3. Enter any topic (e.g., "LinkedIn growth tips")
4. Click "Generate Post"
5. You should see an AI-generated post!

## Troubleshooting

**Build Errors?**
- Make sure you ran `npm install` first
- Check Node.js version: `node --version` (should be 16+)
- Clear cache: `rm -rf node_modules dist && npm install`

**API Not Working?**
- Verify your OpenAI API key is set
- Check browser console (F12) for errors
- Make sure you have OpenAI credits

**Extension Not Loading?**
- Check that `dist/` folder exists
- Look for errors in Chrome extensions page
- Try `npm run build` again

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

## Project Structure

```
src/
├── core/               # Core systems (AI, humanization, detection)
├── background/         # Background service worker
├── content/            # Content script (runs on LinkedIn)
├── popup/              # React popup UI
├── config/             # Configuration
└── types/              # TypeScript types
```

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [AI-FEATURES.md](AI-FEATURES.md) for AI capabilities
- See [API-KEY-SETUP.md](API-KEY-SETUP.md) for detailed API setup

---

**Ready to automate LinkedIn safely!** 🚀
