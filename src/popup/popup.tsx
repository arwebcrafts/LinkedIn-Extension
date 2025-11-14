/**
 * POPUP UI (React)
 * Main control panel for the extension
 */

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';
import { StorageManager } from '../core/storage-manager';
import { WarmupProtocol, CooldownManager } from '../core/warmup-protocol';
import { AccountAge, SpeedMode } from '../types';
import PostCreator from './PostCreator';
import { initializeWithAPIKey, isOpenAIConfigured } from '../config/config';

interface Stats {
  todayActions: number;
  weekActions: number;
  monthActions: number;
  successRate: number;
  averageActionsPerDay: number;
}

const Popup: React.FC = () => {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [accountAge, setAccountAge] = useState<AccountAge>(AccountAge.SIX_TO_TWELVE_MONTHS);
  const [speedMode, setSpeedMode] = useState<SpeedMode>(SpeedMode.SLOW);
  const [stats, setStats] = useState<Stats | null>(null);
  const [warmupStatus, setWarmupStatus] = useState<any>(null);
  const [cooldown, setCooldown] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'history'>('dashboard');
  const [licenseKey, setLicenseKey] = useState('');
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isOpenAISetup, setIsOpenAISetup] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const enabled = await StorageManager.isAutomationEnabled();
    setIsAutomationEnabled(enabled);

    const config = await StorageManager.getConfig();
    setAccountAge(config.accountAge);
    setSpeedMode(config.speedMode);

    const statistics = await StorageManager.getStatistics();
    setStats(statistics);

    const warmup = new WarmupProtocol(config.accountAge, config.warmupStartDate);
    setWarmupStatus(warmup.getWarmupStatus());

    const cooldownCheck = await CooldownManager.isInCooldown();
    setCooldown(cooldownCheck);

    const data = await chrome.storage.local.get(['licenseValid', 'licenseKey']);
    setIsLicenseValid(data.licenseValid || false);
    setLicenseKey(data.licenseKey || '');
  };

  const handleToggleAutomation = async () => {
    const newState = !isAutomationEnabled;
    await StorageManager.setAutomationEnabled(newState);
    setIsAutomationEnabled(newState);

    // Send message to content script
    const tabs = await chrome.tabs.query({ url: 'https://*.linkedin.com/*' });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: newState ? 'START_AUTOMATION' : 'STOP_AUTOMATION',
        });
      }
    }
  };

  const handleSpeedModeChange = async (mode: SpeedMode) => {
    await StorageManager.updateConfig({ speedMode: mode });
    setSpeedMode(mode);
  };

  const handleAccountAgeChange = async (age: AccountAge) => {
    await StorageManager.updateConfig({ accountAge: age });
    setAccountAge(age);
    await loadData(); // Reload to update warmup status
  };

  const handleVerifyLicense = async () => {
    const response = await chrome.runtime.sendMessage({
      type: 'VERIFY_LICENSE',
      licenseKey,
    });

    if (response.valid) {
      setIsLicenseValid(true);
      alert('License verified successfully!');
    } else {
      alert('Invalid license key. Please check and try again.');
    }
  };

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Show license activation screen if not activated
  if (!isLicenseValid) {
    return (
      <div className="license-screen">
        <div className="logo">
          <h1>Kommentify</h1>
          <p>The Safest LinkedIn Automation</p>
        </div>
        <div className="license-form">
          <h2>Activate Your License</h2>
          <input
            type="text"
            placeholder="Enter your license key"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            className="license-input"
          />
          <button onClick={handleVerifyLicense} className="btn btn-primary">
            Activate
          </button>
          <p className="help-text">
            Don't have a license? <a href="https://kommentify.com/pricing" target="_blank">Get one here</a>
          </p>
        </div>
      </div>
    );
  }

  // Show cooldown screen if in cooldown
  if (cooldown && cooldown.inCooldown) {
    return (
      <div className="cooldown-screen">
        <div className="cooldown-icon">⚠️</div>
        <h2>Safety Cooldown Active</h2>
        <p>{cooldown.reason}</p>
        <div className="cooldown-timer">
          <strong>Time Remaining:</strong>
          <div className="timer">{formatTime(cooldown.remainingTime)}</div>
        </div>
        <div className="cooldown-message">
          <p>All automation is disabled for your account protection.</p>
          <p>Please use LinkedIn manually during this time to appear normal.</p>
        </div>
        <button onClick={() => window.close()} className="btn btn-secondary">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="popup">
      <header className="header">
        <div className="logo-small">Kommentify</div>
        <div className={`status-indicator ${isAutomationEnabled ? 'active' : 'inactive'}`}>
          <div className="dot"></div>
          {isAutomationEnabled ? 'Running' : 'Stopped'}
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="tab-content">
          {/* Warm-up Status */}
          {warmupStatus && warmupStatus.isInWarmup && (
            <div className="warmup-banner">
              <div className="warmup-header">
                <span>🔥 Warm-up Phase</span>
                <span className="warmup-day">
                  Day {warmupStatus.currentDay}/{warmupStatus.totalDays}
                </span>
              </div>
              <div className="warmup-progress">
                <div
                  className="warmup-bar"
                  style={{ width: `${(warmupStatus.currentDay / warmupStatus.totalDays) * 100}%` }}
                ></div>
              </div>
              <div className="warmup-restrictions">
                {warmupStatus.restrictions.map((r: string, i: number) => (
                  <div key={i} className="restriction-item">{r}</div>
                ))}
              </div>
            </div>
          )}

          {/* Control Panel */}
          <div className="control-panel">
            <button
              onClick={handleToggleAutomation}
              className={`btn-toggle ${isAutomationEnabled ? 'btn-stop' : 'btn-start'}`}
              disabled={warmupStatus && !warmupStatus.canProceed}
            >
              {isAutomationEnabled ? 'Stop Automation' : 'Start Automation'}
            </button>
            {warmupStatus && !warmupStatus.canProceed && (
              <p className="warning-text">Automation blocked for accounts under 3 months</p>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Today</div>
                <div className="stat-value">{stats.todayActions}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">This Week</div>
                <div className="stat-value">{stats.weekActions}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">This Month</div>
                <div className="stat-value">{stats.monthActions}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Success Rate</div>
                <div className="stat-value">{stats.successRate.toFixed(1)}%</div>
              </div>
            </div>
          )}

          {/* AI Tools */}
          <div className="ai-tools-section">
            <h3>🤖 AI Content Tools</h3>
            <button onClick={() => setShowPostCreator(true)} className="btn-create-post">
              ✨ Create Lead Magnet Post
            </button>
            <p className="help-text-small">Generate viral, engaging LinkedIn posts that drive real connections</p>
          </div>

          {/* Quick Info */}
          <div className="info-section">
            <h3>Safety First</h3>
            <ul className="safety-tips">
              <li>✓ Advanced anti-detection active</li>
              <li>✓ Human-like behavior simulation</li>
              <li>✓ Real-time warning monitoring</li>
              <li>✓ Automatic safety breaks</li>
            </ul>
          </div>
        </div>
      )}

      {/* POST CREATOR MODAL */}
      {showPostCreator && <PostCreator onClose={() => setShowPostCreator(false)} />}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="settings-section">
            <h3>Account Age</h3>
            <p className="help-text">When did you create your LinkedIn account?</p>
            <select
              value={accountAge}
              onChange={(e) => handleAccountAgeChange(e.target.value as AccountAge)}
              className="select"
            >
              <option value={AccountAge.UNDER_3_MONTHS}>Under 3 months (Blocked)</option>
              <option value={AccountAge.THREE_TO_SIX_MONTHS}>3-6 months</option>
              <option value={AccountAge.SIX_TO_TWELVE_MONTHS}>6-12 months</option>
              <option value={AccountAge.ONE_TO_TWO_YEARS}>1-2 years</option>
              <option value={AccountAge.OVER_TWO_YEARS}>2+ years</option>
            </select>
          </div>

          <div className="settings-section">
            <h3>Speed Mode</h3>
            <p className="help-text">Slower is safer. We recommend "Slow" for most users.</p>
            <div className="speed-options">
              {[SpeedMode.ULTRA_SLOW, SpeedMode.SLOW, SpeedMode.MEDIUM, SpeedMode.NORMAL].map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSpeedModeChange(mode)}
                  className={`speed-btn ${speedMode === mode ? 'active' : ''}`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h3>Daily Limits</h3>
            <p className="help-text">Limits are automatically set based on warm-up phase.</p>
            {warmupStatus && (
              <div className="limits-info">
                <div className="limit-item">
                  <span>Max Actions/Day:</span>
                  <strong>{warmupStatus.config.maxActionsPerDay}</strong>
                </div>
                <div className="limit-item">
                  <span>Max Comments/Day:</span>
                  <strong>{warmupStatus.config.maxCommentsPerDay}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="settings-section">
            <h3>Data Management</h3>
            <button onClick={async () => {
              const data = await StorageManager.exportData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'kommentify-backup.json';
              a.click();
            }} className="btn btn-secondary">
              Export Data
            </button>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="tab-content">
          <h3>Recent Activity</h3>
          <p className="help-text">Coming soon: Detailed action history and analytics</p>
          <div className="placeholder">
            <div className="placeholder-icon">📊</div>
            <p>Activity history will appear here</p>
          </div>
        </div>
      )}

      <footer className="footer">
        <small>Kommentify v1.0.0 - Safe LinkedIn Automation</small>
      </footer>
    </div>
  );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Popup />);
