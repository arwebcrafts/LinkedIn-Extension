# Kommentify - LinkedIn Engagement Automation Extension

**The Safest and Most Effective LinkedIn Automation Tool**

Kommentify is a Chrome/Edge browser extension that performs human-like LinkedIn engagement through AI-powered comments, strategic likes, and targeted outreach. Built with advanced anti-detection technology and mandatory safety protocols.

## 🎯 Core Mission

Build the **safest and most effective** LinkedIn automation tool that:
- **NEVER gets users banned** through sophisticated anti-detection
- **Increases genuine engagement** with authentic, high-quality interactions
- **Builds real connections** that drive business results
- **Protects user reputation** by making every action indistinguishable from human behavior

**Core Principle:** Slow and safe beats fast and risky. One banned account destroys reputation worse than 100 refunds.

---

## 🚀 Key Features

### Advanced Anti-Detection
- ✅ **15+ Humanization Techniques** - Timing randomization, cursor simulation, typing patterns
- ✅ **Bezier Curve Mouse Movement** - Natural cursor paths, not straight lines
- ✅ **Realistic Typing Simulation** - Variable speed (40-80 WPM), random typos with corrections
- ✅ **Session Fatigue Modeling** - Actions slow down naturally over time
- ✅ **Daily Rhythm Simulation** - Activity matches human patterns throughout the day

### Real-Time Safety Monitoring
- ✅ **DOM Warning Detection** - Monitors for LinkedIn warning messages in real-time
- ✅ **Network Error Tracking** - Detects 429/403 responses instantly
- ✅ **Performance Anomaly Detection** - Identifies when actions take unusually long
- ✅ **Pattern Risk Analysis** - Prevents bot-like consistent timing
- ✅ **Automatic Emergency Stop** - Immediately halts on any warning sign

### Mandatory Warm-Up Protocol
- ✅ **Account Age Detection** - Different protocols based on account age
- ✅ **Progressive Limits** - Gradually increases activity over weeks
- ✅ **New Account Protection** - Blocks automation for accounts <3 months old
- ✅ **Profile Completeness Check** - Requires photos, connections, work history
- ✅ **Cannot Be Skipped** - Server-side enforcement of warm-up rules

### Engagement Mixing
- ✅ **Action Variety** - 50% likes only, 25% like+comment, 15% comment only, 10% just browsing
- ✅ **Random Skipping** - Doesn't engage with every post (30-40% skip rate)
- ✅ **Connection-Based Behavior** - Engages more with 1st-degree connections
- ✅ **Viral Post Avoidance** - Skips posts with >1000 likes 60% of time
- ✅ **Age-Based Filtering** - Skips old posts (>48 hours) 70% of time

---

## 📦 Project Structure

```
LinkedIn-Extension/
├── manifest.json                 # Extension manifest (Manifest V3)
├── package.json                  # Dependencies and build scripts
├── tsconfig.json                 # TypeScript configuration
├── webpack.config.js             # Webpack build configuration
├── icons/                        # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── types/
    │   └── index.ts              # TypeScript type definitions
    ├── core/
    │   ├── humanization-engine.ts    # Timing, mouse, keyboard simulation
    │   ├── detection-system.ts       # Warning detection & response
    │   ├── warmup-protocol.ts        # Account age-based restrictions
    │   └── storage-manager.ts        # Data persistence
    ├── background/
    │   └── service-worker.ts         # Background automation coordinator
    ├── content/
    │   ├── content-script.ts         # LinkedIn DOM interaction
    │   └── content-styles.css        # Injected styles
    └── popup/
        ├── popup.html                # Popup UI template
        ├── popup.tsx                 # React popup component
        └── popup.css                 # Popup styles
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Chrome or Edge browser

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
# Production build
npm run build

# Development build with watch mode
npm run dev
```

This will create a `dist/` folder with the compiled extension.

### 3. Load Extension in Chrome/Edge

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The extension should now appear in your extensions list

### 4. Pin the Extension

- Click the puzzle icon in your browser toolbar
- Find "Kommentify" and click the pin icon
- The extension icon will now appear in your toolbar

---

## 🎮 Usage

### First-Time Setup

1. **Click the extension icon** to open the popup
2. **Enter your license key** (get one from [kommentify.com](https://kommentify.com))
3. **Select your account age:**
   - Under 3 months: **BLOCKED** (too risky)
   - 3-6 months: 28-day strict warm-up
   - 6-12 months: 14-day standard warm-up
   - 1-2 years: 7-day quick warm-up
   - 2+ years: 3-day minimal warm-up

4. **Choose speed mode:**
   - **Ultra Slow**: Safest (recommended for new accounts)
   - **Slow**: Safe (recommended for most users)
   - **Medium**: Moderate risk
   - **Normal**: Higher risk (only for established accounts)

### Starting Automation

1. **Open LinkedIn** in your browser
2. **Navigate to your feed** (linkedin.com/feed)
3. **Click the extension icon** and click **"Start Automation"**
4. **Minimize or move to another tab** - automation runs in background
5. **Monitor the status indicator** - shows "Running" when active

### Safety Features

**Automatic Breaks:**
- Mini break: 2-4 minutes every 8-12 actions
- Medium break: 8-15 minutes every 25-30 actions
- Session end: After 40-50 actions or 60 minutes

**Warning Detection:**
- If LinkedIn shows ANY warning message, automation stops immediately
- 48-hour mandatory cooldown activated
- Email alert sent (if configured)
- Cannot be overridden (for your protection)

**Warm-Up Enforcement:**
- Limits cannot be exceeded during warm-up
- Settings locked to safe modes
- Progress tracked server-side (cannot be bypassed)

---

## 🧠 How It Works

### 1. Humanization Engine

**Timing Randomization:**
- Base delays: 25-45 seconds between actions
- Never uses same delay twice
- Adds entropy using `crypto.getRandomValues()`
- Applies session fatigue (slows down over time)
- Matches daily rhythm (slower at lunch, after hours)

**Mouse Simulation:**
- Bezier curve paths (not straight lines)
- Variable speed (slower near targets)
- Random overshoots with corrections
- Hover events before clicking
- Occasional off-target movements

**Typing Simulation:**
- Variable typing speed: 40-80 WPM
- Random typos (2-5%) with backspace corrections
- Natural pauses (longer before capitals, after punctuation)
- Occasional word deletion and retyping
- Never pastes (types character by character)

### 2. Detection System

**Level 1: DOM-Based Detection**
- Monitors 10+ DOM selectors for warning messages
- Checks for CAPTCHA challenges
- Detects disabled action buttons
- Watches for security checkpoint redirects

**Level 2: Behavioral Detection**
- Tracks consecutive action failures (3+ triggers alert)
- Measures action completion time (3x baseline = warning)
- Detects suspiciously fast successes (possible shadow ban)

**Level 3: Pattern Detection**
- Analyzes action timing consistency
- Detects approaching daily limits (90% = warning)
- Monitors session duration (>45 min = warning)
- Calculates timing variance (too consistent = bot-like)

### 3. Warm-Up Protocol

**Account Under 3 Months:**
- ❌ Automation **BLOCKED**
- Can use manual AI suggestions only
- Must build profile organically

**3-6 Months (28-day protocol):**
- Week 1: 5 actions/day, NO comments, 1st-degree only
- Week 2: 10 actions/day, 1 comment, 1st & 2nd-degree
- Week 3: 15 actions/day, 2 comments, basic targeting
- Week 4: 25 actions/day, 3 comments, all features

**6-12 Months (14-day protocol):**
- Week 1: 15 actions/day, 3 comments
- Week 2: 30 actions/day, 7 comments

**1-2 Years (7-day protocol):**
- 40 actions/day, 10 comments

**2+ Years (3-day protocol):**
- 60 actions/day, 15 comments

---

## 🔧 Development

### Project Architecture

**Manifest V3:**
- Modern Chrome extension standard
- Service worker background script (not persistent)
- Content scripts injected into LinkedIn pages
- Message passing for communication

**TypeScript:**
- Type safety throughout codebase
- Interfaces for all data structures
- Better IDE support and error catching

**React:**
- Popup UI built with React
- Clean, maintainable component structure
- Easy to extend and customize

**Webpack:**
- Bundles all TypeScript and React code
- Separate bundles for background, content, popup
- Development and production builds

### Build Commands

```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### File Descriptions

**Core Systems:**
- `humanization-engine.ts` - All timing, mouse, keyboard simulation
- `detection-system.ts` - Warning detection + response protocol
- `warmup-protocol.ts` - Account age restrictions + cooldown manager
- `storage-manager.ts` - Chrome storage abstraction layer

**Scripts:**
- `service-worker.ts` - Coordinates automation, handles alarms, communicates with backend
- `content-script.ts` - Runs on LinkedIn pages, performs DOM interactions
- `popup.tsx` - React UI for extension control panel

---

## 🔐 Security & Privacy

### No Credentials Stored
- Extension uses your active LinkedIn session
- Never asks for your LinkedIn password
- No credentials sent to our servers

### Local Processing
- Humanization happens locally in your browser
- No data sent to backend except:
  - License verification
  - AI comment generation (post content only)
  - Usage statistics (anonymous)
  - Warning detection reports

### Data Storage
- All data stored locally using Chrome Storage API
- Export/import functionality for backups
- No tracking or analytics beyond usage limits

---

## ⚙️ Configuration

### Speed Modes

| Mode | Base Delay | Reading Time | Risk Level |
|------|-----------|--------------|------------|
| Ultra Slow | 45-75s | 20-100s | Minimal |
| Slow | 35-55s | 15-85s | Low |
| Medium | 25-45s | 12-75s | Moderate |
| Normal | 20-40s | 10-65s | Higher |

### Default Limits

Limits are automatically set based on:
- Account age
- Warm-up phase day
- Warning history
- Profile completeness

Cannot be manually overridden during warm-up.

---

## 🐛 Troubleshooting

### Extension Not Loading
- Ensure you ran `npm run build`
- Check that `dist/` folder exists
- Verify manifest.json is in dist/ folder
- Check browser console for errors

### Automation Not Starting
- Check if license is activated
- Verify you're on linkedin.com/feed
- Ensure account age is set (not "Under 3 months")
- Check if in cooldown period

### LinkedIn Warnings
- **STOP using extension immediately**
- Wait 48-hour cooldown period
- Use LinkedIn manually during cooldown
- Review your settings (account age, speed mode)
- Consider longer warm-up period

### Actions Not Working
- Check LinkedIn DOM selectors (may need updating)
- Verify content script is injected (check browser console)
- Ensure permissions are granted
- Check for LinkedIn UI changes (they update frequently)

---

## 📝 Backend API (Required for Production)

This extension requires a backend API for:
1. **License verification**
2. **AI comment generation** (OpenAI integration)
3. **Usage tracking**
4. **Warning reports**
5. **Email alerts**

### API Endpoints Needed

```
POST /api/verify-license
POST /api/generate-comment
POST /api/track-action
POST /api/report-warning
POST /api/send-alert-email
POST /api/sync
GET  /health
```

Backend implementation not included in this repository.

---

## 📜 License

See LICENSE file for details.

---

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK**

While Kommentify implements advanced anti-detection and safety features, automation on LinkedIn is against their Terms of Service. Using this extension may result in account restrictions or bans.

We have built extensive safety features to minimize risk, but we cannot guarantee your account will never be flagged.

**Recommendations:**
- Start with conservative settings
- Follow warm-up protocols strictly
- Never rush or skip safety features
- Monitor your account regularly
- Use on secondary accounts first

---

## 🤝 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact support@kommentify.com
- Visit [kommentify.com/docs](https://kommentify.com/docs)

---

## 🚀 Roadmap

**v1.1 (Planned):**
- [ ] AI-powered post creation
- [ ] Advanced targeting filters
- [ ] Analytics dashboard
- [ ] Multi-account support
- [ ] Schedule automation sessions

**v1.2 (Planned):**
- [ ] DM automation
- [ ] Connection request automation
- [ ] Profile optimization suggestions
- [ ] A/B testing for comments

---

**Built with ❤️ for safe, effective LinkedIn automation**
