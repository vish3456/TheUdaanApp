// Debug utilities for Bus Tracker application
import { updateAPIConfig, apiConfig } from '../config/api';

// Global debug functions (available in browser console)
declare global {
  interface Window {
    busTrackerDebug: {
      enableRealAPI: () => void;
      enableMockAPI: () => void;
      showConfig: () => void;
      setAPIUrl: (url: string) => void;
      setWSUrl: (url: string) => void;
      testAPI: () => Promise<void>;
    };
  }
}

// Debug helper functions
export const debugHelpers = {
  enableRealAPI: () => {
    updateAPIConfig({ enableMockMode: false });
    console.log('✅ Real API mode enabled');
    console.log('Current config:', apiConfig);
  },

  enableMockAPI: () => {
    updateAPIConfig({ enableMockMode: true });
    console.log('🔧 Mock API mode enabled');
    console.log('Current config:', apiConfig);
  },

  showConfig: () => {
    console.log('Current API Configuration:', apiConfig);
  },

  setAPIUrl: (url: string) => {
    updateAPIConfig({ baseURL: url });
    console.log(`🌐 API URL updated to: ${url}`);
  },

  setWSUrl: (url: string) => {
    updateAPIConfig({ wsURL: url });
    console.log(`🔌 WebSocket URL updated to: ${url}`);
  },

  testAPI: async () => {
    try {
      console.log('🧪 Testing API connection...');
      const response = await fetch(`${apiConfig.baseURL}/health`);
      if (response.ok) {
        console.log('✅ API connection successful');
      } else {
        console.log(`❌ API returned status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ API connection failed:', error);
      console.log('💡 Make sure your API server is running and CORS is configured');
    }
  }
};

// Make debug functions available globally in development
if (typeof window !== 'undefined') {
  // Check if we're in development mode via localStorage or hostname
  const isDevelopment = 
    localStorage.getItem('debug_api') === 'true' || 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    window.busTrackerDebug = debugHelpers;
    
    // Log available debug commands
    console.log(`
🚌 Bus Tracker Debug Commands Available:

• busTrackerDebug.enableRealAPI()  - Switch to real API calls
• busTrackerDebug.enableMockAPI()  - Switch to mock data
• busTrackerDebug.showConfig()     - Show current configuration
• busTrackerDebug.setAPIUrl(url)   - Set API base URL
• busTrackerDebug.setWSUrl(url)    - Set WebSocket URL
• busTrackerDebug.testAPI()        - Test API connection

Current mode: ${apiConfig.enableMockMode ? 'MOCK' : 'REAL'} API
    `);
  }
}