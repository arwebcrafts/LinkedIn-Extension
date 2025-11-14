/**
 * CONFIGURATION
 * Central configuration for the extension
 *
 * SECURITY NOTE: In production, API keys should be stored securely in:
 * 1. Backend server (recommended)
 * 2. Chrome Storage with encryption
 * 3. Environment variables during build
 *
 * Never commit API keys to git!
 */

export interface AppConfig {
  openaiApiKey: string;
  backendApiUrl: string;
  environment: 'development' | 'production';
  version: string;
  features: {
    aiComments: boolean;
    aiPosts: boolean;
    automation: boolean;
    analytics: boolean;
  };
}

/**
 * Get configuration from storage or defaults
 */
export async function getConfig(): Promise<AppConfig> {
  const stored = await chrome.storage.local.get(['config']);

  if (stored.config) {
    return stored.config;
  }

  // Try to load API key from generated file
  let autoLoadedApiKey = '';
  try {
    const apiKeyModule = await import('./api-key');
    autoLoadedApiKey = (apiKeyModule as any).OPENAI_API_KEY || '';
  } catch (e) {
    // api-key.ts not configured yet
  }

  // Default configuration
  const defaultConfig: AppConfig = {
    openaiApiKey: autoLoadedApiKey, // Set via setup script or popup
    backendApiUrl: 'https://api.kommentify.com', // Replace with your backend
    environment: 'development',
    version: '1.0.0',
    features: {
      aiComments: true,
      aiPosts: true,
      automation: true,
      analytics: true,
    },
  };

  await chrome.storage.local.set({ config: defaultConfig });
  return defaultConfig;
}

/**
 * Update configuration
 */
export async function updateConfig(updates: Partial<AppConfig>): Promise<void> {
  const current = await getConfig();
  const updated = { ...current, ...updates };
  await chrome.storage.local.set({ config: updated });
}

/**
 * Set OpenAI API key securely
 */
export async function setOpenAIKey(apiKey: string): Promise<void> {
  const config = await getConfig();
  config.openaiApiKey = apiKey;
  await chrome.storage.local.set({ config });

  console.log('OpenAI API key configured successfully');
}

/**
 * Get OpenAI API key
 */
export async function getOpenAIKey(): Promise<string> {
  const config = await getConfig();
  return config.openaiApiKey;
}

/**
 * Check if OpenAI is configured
 */
export async function isOpenAIConfigured(): Promise<boolean> {
  const apiKey = await getOpenAIKey();
  return apiKey.length > 0;
}

/**
 * Initialize configuration with API key
 */
export async function initializeWithAPIKey(apiKey: string): Promise<void> {
  await setOpenAIKey(apiKey);
  console.log('✅ Configuration initialized with OpenAI API key');
}

export default {
  getConfig,
  updateConfig,
  setOpenAIKey,
  getOpenAIKey,
  isOpenAIConfigured,
  initializeWithAPIKey,
};
