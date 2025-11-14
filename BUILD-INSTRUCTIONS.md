# 📦 Build Instructions

## Important: Install Dependencies First!

Before building, you **MUST** install all dependencies:

```bash
npm install
```

This installs:
- React & React DOM
- TypeScript
- Webpack & loaders
- All dev dependencies

## Build Commands

### Production Build
```bash
npm run build
```
Creates optimized `dist/` folder ready for Chrome.

### Development Build (Watch Mode)
```bash
npm run dev
```
Auto-rebuilds on file changes. Great for development.

### Type Checking Only
```bash
npm run type-check
```
Checks TypeScript types without building.

### Linting
```bash
npm run lint
```
Checks code quality.

## What Gets Built

The build process creates:

```
dist/
├── manifest.json              # Extension manifest
├── icons/                     # Extension icons
├── background/
│   └── service-worker.js      # Background script
├── content/
│   ├── content-script.js      # LinkedIn page script
│   └── content-styles.css     # Injected styles
└── popup/
    ├── popup.html             # Popup UI
    ├── popup.js               # Popup logic
    └── (bundled styles)       # CSS included
```

## First Time Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd LinkedIn-Extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API key**
   ```bash
   npm run setup
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **Load in Chrome**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select `dist/` folder

## Common Build Errors

### "webpack: not found"
**Cause:** Dependencies not installed

**Fix:**
```bash
npm install
```

### TypeScript errors
**Cause:** Type issues in code

**Fix:**
```bash
npm run type-check
```
Review and fix reported errors.

### "Cannot find module"
**Cause:** Missing import or wrong path

**Fix:** Check file paths and imports.

### Build succeeds but extension fails to load
**Cause:** Invalid manifest or runtime errors

**Fix:**
- Check Chrome DevTools console
- Look at extension error page
- Review manifest.json syntax

## Clean Build

If you encounter persistent issues:

```bash
# Remove all generated files
rm -rf node_modules dist

# Fresh install
npm install

# Rebuild
npm run build
```

## Production Deployment

For production release:

1. Update version in `manifest.json`
2. Run production build: `npm run build`
3. Test thoroughly in Chrome
4. Zip the `dist/` folder
5. Upload to Chrome Web Store

## File Watching

The dev build watches these patterns:
- `src/**/*.ts`
- `src/**/*.tsx`
- `src/**/*.css`
- `manifest.json`

Changes trigger automatic rebuild.

## Build Performance

**First build:** ~5-10 seconds
**Incremental builds:** ~1-2 seconds

To speed up:
- Use `npm run dev` for development
- Only use `npm run build` for production

---

**Need help?** Check the error message carefully - it usually points to the issue!
