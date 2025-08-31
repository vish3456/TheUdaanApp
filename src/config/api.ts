// API Configuration for Browser Environment
// This file manages API endpoints and configuration safely for browser use

export interface APIConfig {
  baseURL: string;
  wsURL: string;
  timeout: number;
  enableMockMode: boolean;
}

// Default configuration
const DEFAULT_CONFIG: APIConfig = {
  baseURL: 'http://localhost:3001/api',
  wsURL: 'ws://localhost:3001/ws',
  timeout: 10000,
  enableMockMode: true // Set to false when real API is ready
};

// Get configuration from window object or use defaults
// This allows for runtime configuration without build-time environment variables
const getConfig = (): APIConfig => {
  // Check if configuration is provided via window object
  const windowConfig = (window as any).__BUS_TRACKER_CONFIG__;
  
  if (windowConfig) {
    return {
      ...DEFAULT_CONFIG,
      ...windowConfig
    };
  }

  // For development, you can also check localStorage for config overrides
  try {
    const localConfig = localStorage.getItem('busTracker_config');
    if (localConfig) {
      const parsed = JSON.parse(localConfig);
      return {
        ...DEFAULT_CONFIG,
        ...parsed
      };
    }
  } catch (error) {
    console.warn('Failed to parse local config:', error);
  }

  return DEFAULT_CONFIG;
};

export const apiConfig = getConfig();

// Helper function to update config at runtime
export const updateAPIConfig = (newConfig: Partial<APIConfig>): void => {
  Object.assign(apiConfig, newConfig);
  
  // Optionally save to localStorage for persistence
  try {
    localStorage.setItem('busTracker_config', JSON.stringify({
      ...DEFAULT_CONFIG,
      ...newConfig
    }));
  } catch (error) {
    console.warn('Failed to save config to localStorage:', error);
  }
};

// Debug helper - log current configuration
if (typeof window !== 'undefined' && localStorage.getItem('debug_api') === 'true') {
  console.log('API Configuration:', apiConfig);
}