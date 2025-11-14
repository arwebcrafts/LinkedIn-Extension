╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  🚨 BUILD ERROR? READ THIS FIRST!                               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

If you're seeing build errors, you need to:

1️⃣  INSTALL DEPENDENCIES (Most Common Issue!)
   
   npm install

   This installs React, TypeScript, Webpack, and all tools needed to build.

2️⃣  CREATE API KEY FILE

   You have 3 options:

   Option A (Easiest):
   npm run setup
   # Then paste your OpenAI API key when prompted

   Option B (Manual):
   cp src/config/api-key.example.ts src/config/api-key.ts
   # Then edit api-key.ts and add your OpenAI key

   Option C (Later):
   # Leave it empty for now, configure via popup after building

3️⃣  BUILD THE EXTENSION

   npm run build

   Creates a dist/ folder with the compiled extension.

4️⃣  LOAD IN CHROME

   1. Go to chrome://extensions/
   2. Enable "Developer mode" (top right toggle)
   3. Click "Load unpacked"
   4. Select the dist/ folder

═══════════════════════════════════════════════════════════════════

COMMON ERRORS:

❌ "webpack: not found"
✅ Fix: npm install

❌ "Cannot find module './api-key'"
✅ Fix: Run npm run setup OR create api-key.ts manually

❌ "Property 'cryptoRandomRange' is private"
✅ Fix: This is already fixed. Pull latest code.

❌ Extension loads but doesn't work
✅ Fix: Check Chrome DevTools console (F12) for errors

═══════════════════════════════════════════════════════════════════

QUICK START (Copy/Paste):

npm install
npm run setup
npm run build

Then load dist/ folder in Chrome!

═══════════════════════════════════════════════════════════════════

For detailed help:
- READ: QUICK-START.md
- READ: BUILD-INSTRUCTIONS.md
- READ: API-KEY-SETUP.md

