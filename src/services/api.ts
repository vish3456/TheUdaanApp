// API Service Layer for Bus Tracking Application
// This file provides a centralized API interface for all backend operations

export interface BusLocation {
  id: string;
  routeNumber: string;
  lat: number;
  lng: number;
  direction: string;
  occupancy: 'low' | 'medium' | 'high';
  nextStop: string;
  estimatedArrival: string;
  vehicleNumber?: string;
  speed?: number;
  delay?: number;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  routes: string[];
  nextArrivals: Array<{
    route: string;
    direction: string;
    eta: string;
    occupancy: 'low' | 'medium' | 'high';
  }>;
  facilities: string[];
}

export interface Route {
  id: string;
  number: string;
  name: string;
  description: string;
  frequency: string;
  operatingHours: string;
  stops: string[];
}

export interface BusDetails {
  id: string;
  routeNumber: string;
  vehicleNumber: string;
  driver: string;
  occupancy: 'low' | 'medium' | 'high';
  occupancyPercentage: number;
  currentSpeed: number;
  nextStop: string;
  estimatedArrival: string;
  direction: string;
  totalStops: number;
  completedStops: number;
  delay: number;
  amenities: string[];
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
  }>;
  upcomingStops: Array<{
    name: string;
    eta: string;
    isNext: boolean;
  }>;
  route: {
    name: string;
    description: string;
    startTime: string;
    endTime: string;
  };
}

export interface StopDetails {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  routes: Array<{
    number: string;
    name: string;
    frequency: string;
  }>;
  liveArrivals: Array<{
    route: string;
    routeName: string;
    direction: string;
    eta: string;
    etaMinutes: number;
    occupancy: 'low' | 'medium' | 'high';
    occupancyPercentage: number;
    vehicleId: string;
    isRealTime: boolean;
  }>;
  facilities: Array<{
    name: string;
    icon: string;
    available: boolean;
  }>;
  accessibility: {
    wheelchairAccessible: boolean;
    tactilePaving: boolean;
    audioAnnouncements: boolean;
  };
  nearbyPOIs: Array<{
    name: string;
    category: string;
    distance: string;
  }>;
  transferConnections: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: {
    favoriteRoutes: string[];
    notifications: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

import { apiConfig } from '../config/api';

// API Configuration
const API_BASE_URL = apiConfig.baseURL;
const API_TIMEOUT = apiConfig.timeout;

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('busTracker_token');
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    if (apiConfig.enableMockMode) {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResponse: AuthResponse = {
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: '1',
          email,
          name: email.split('@')[0],
          preferences: {
            favoriteRoutes: [],
            notifications: true,
          },
        },
      };
      return mockResponse;
    }

    // Real API implementation
    const response = await makeAuthenticatedRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  signup: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    if (apiConfig.enableMockMode) {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResponse: AuthResponse = {
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: '1',
          email,
          name,
          preferences: {
            favoriteRoutes: [],
            notifications: true,
          },
        },
      };
      return mockResponse;
    }

    // Real API implementation
    const response = await makeAuthenticatedRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    return response.json();
  },

  refreshToken: async (): Promise<AuthResponse> => {
    if (apiConfig.enableMockMode) {
      throw new Error('Token refresh not implemented in mock mode');
    }

    // Real API implementation
    const response = await makeAuthenticatedRequest('/auth/refresh', {
      method: 'POST',
    });
    return response.json();
  },
};

// Real-time Bus Location API
export const busAPI = {
  getLiveBuses: async (bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<BusLocation[]> => {
    if (apiConfig.enableMockMode) {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      return [
      {
        id: '1',
        routeNumber: '42',
        lat: 40.7128 + (Math.random() - 0.5) * 0.01,
        lng: -74.0060 + (Math.random() - 0.5) * 0.01,
        direction: 'Downtown',
        occupancy: 'medium',
        nextStop: 'Times Square',
        estimatedArrival: '3 min',
        vehicleNumber: 'BUS-4201',
        speed: 25,
        delay: 2,
      },
      {
        id: '2',
        routeNumber: '15',
        lat: 40.7589 + (Math.random() - 0.5) * 0.01,
        lng: -73.9851 + (Math.random() - 0.5) * 0.01,
        direction: 'Uptown',
        occupancy: 'low',
        nextStop: 'Central Park',
        estimatedArrival: '7 min',
        vehicleNumber: 'BUS-1503',
        speed: 30,
        delay: 0,
      },
      {
        id: '3',
        routeNumber: '23',
        lat: 40.7505 + (Math.random() - 0.5) * 0.01,
        lng: -73.9934 + (Math.random() - 0.5) * 0.01,
        direction: 'Crosstown',
        occupancy: 'high',
        nextStop: 'Penn Station',
        estimatedArrival: '12 min',
        vehicleNumber: 'BUS-2307',
        speed: 15,
        delay: 5,
      },
    ];
    }

    // Real API implementation
    const queryParams = bounds ? 
      `?north=${bounds.north}&south=${bounds.south}&east=${bounds.east}&west=${bounds.west}` : '';
    const response = await makeAuthenticatedRequest(`/buses/live${queryParams}`);
    return response.json();
  },

  getBusDetails: async (busId: string): Promise<BusDetails> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest(`/buses/${busId}`);
    // return response.json();

    // Mock implementation for now
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockData: { [key: string]: BusDetails } = {
      '1': {
        id: '1',
        routeNumber: '42',
        vehicleNumber: 'BUS-4201',
        driver: 'John Smith',
        occupancy: 'medium',
        occupancyPercentage: 65,
        currentSpeed: 25,
        nextStop: 'Times Square',
        estimatedArrival: '3 min',
        direction: 'Downtown',
        totalStops: 12,
        completedStops: 7,
        delay: 2,
        amenities: ['WiFi', 'USB Charging', 'Wheelchair Accessible', 'Air Conditioning'],
        alerts: [
          { type: 'info', message: 'Next stop: Times Square in 3 minutes' },
          { type: 'warning', message: 'Running 2 minutes behind schedule' }
        ],
        upcomingStops: [
          { name: 'Times Square', eta: '3 min', isNext: true },
          { name: 'Herald Square', eta: '7 min', isNext: false },
          { name: 'Union Square', eta: '12 min', isNext: false },
          { name: 'Wall Street', eta: '18 min', isNext: false }
        ],
        route: {
          name: 'Downtown Express',
          description: 'Fast service to downtown core',
          startTime: '5:00 AM',
          endTime: '12:00 AM'
        }
      },
      // Add more mock data as needed...
    };
    
    return mockData[busId] || mockData['1'];
  },

  getBusesByRoute: async (routeNumber: string): Promise<BusLocation[]> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest(`/routes/${routeNumber}/buses`);
    // return response.json();

    // Mock implementation for now
    const allBuses = await busAPI.getLiveBuses();
    return allBuses.filter(bus => bus.routeNumber === routeNumber);
  },
};

// Stops and Routes API
export const stopsAPI = {
  getAllStops: async (): Promise<Stop[]> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest('/stops');
    // return response.json();

    // Mock implementation for now
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: '1',
        name: 'Times Square',
        lat: 40.7580,
        lng: -73.9855,
        routes: ['42', '15', '23'],
        nextArrivals: [
          { route: '42', direction: 'Downtown', eta: '3 min', occupancy: 'medium' },
          { route: '15', direction: 'Eastbound', eta: '7 min', occupancy: 'low' },
          { route: '23', direction: 'Uptown', eta: '12 min', occupancy: 'high' }
        ],
        facilities: ['Wheelchair Accessible', 'Shelter', 'Real-time Display']
      },
      {
        id: '2',
        name: 'Central Park',
        lat: 40.7829,
        lng: -73.9654,
        routes: ['15', '6'],
        nextArrivals: [
          { route: '15', direction: 'Westbound', eta: '5 min', occupancy: 'low' },
          { route: '6', direction: 'Southbound', eta: '8 min', occupancy: 'medium' }
        ],
        facilities: ['Wheelchair Accessible', 'Bike Rack']
      },
      {
        id: '3',
        name: 'Penn Station',
        lat: 40.7505,
        lng: -73.9934,
        routes: ['23', '42'],
        nextArrivals: [
          { route: '23', direction: 'Downtown', eta: '2 min', occupancy: 'high' },
          { route: '42', direction: 'Uptown', eta: '9 min', occupancy: 'medium' }
        ],
        facilities: ['Wheelchair Accessible', 'Shelter', 'Real-time Display', 'Security']
      }
    ];
  },

  getStopDetails: async (stopId: string): Promise<StopDetails> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest(`/stops/${stopId}`);
    // return response.json();

    // Mock implementation for now - using existing mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockData: { [key: string]: StopDetails } = {
      '1': {
        id: '1',
        name: 'Times Square',
        address: '1560 Broadway, New York, NY 10036',
        coordinates: { lat: 40.7580, lng: -73.9855 },
        routes: [
          { number: '42', name: 'Downtown Express', frequency: 'Every 5-10 min' },
          { number: '15', name: 'Crosstown Local', frequency: 'Every 8-12 min' },
          { number: '23', name: 'University Line', frequency: 'Every 15 min' }
        ],
        liveArrivals: [
          {
            route: '42',
            routeName: 'Downtown Express',
            direction: 'Downtown',
            eta: '3 min',
            etaMinutes: 3,
            occupancy: 'medium',
            occupancyPercentage: 65,
            vehicleId: 'BUS-4201',
            isRealTime: true
          },
          // Add more mock arrivals...
        ],
        facilities: [
          { name: 'Wheelchair Accessible', icon: 'accessibility', available: true },
          { name: 'Shelter', icon: 'umbrella', available: true },
          { name: 'Real-time Display', icon: 'clock', available: true },
          { name: 'Security Camera', icon: 'shield', available: true },
          { name: 'WiFi', icon: 'wifi', available: false }
        ],
        accessibility: {
          wheelchairAccessible: true,
          tactilePaving: true,
          audioAnnouncements: true
        },
        nearbyPOIs: [
          { name: 'Times Square Theater District', category: 'Entertainment', distance: '50m' },
          { name: 'M&M\'s World', category: 'Shopping', distance: '100m' },
          { name: 'Red Lobster', category: 'Restaurant', distance: '150m' },
          { name: 'Times Square Museum', category: 'Museum', distance: '200m' }
        ],
        transferConnections: ['Subway Lines: N, Q, R, W, S, 1, 2, 3, 7']
      },
      // Add more mock data...
    };
    
    return mockData[stopId] || mockData['1'];
  },

  getNearbyStops: async (lat: number, lng: number, radius: number = 500): Promise<Stop[]> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest(
    //   `/stops/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    // );
    // return response.json();

    // Mock implementation for now
    const allStops = await stopsAPI.getAllStops();
    return allStops; // For mock, return all stops
  },
};

// Routes API
export const routesAPI = {
  getAllRoutes: async (): Promise<Route[]> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest('/routes');
    // return response.json();

    // Mock implementation for now
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: '1',
        number: '42',
        name: 'Downtown Express',
        description: 'Fast service to downtown core',
        frequency: 'Every 5-10 minutes',
        operatingHours: '5:00 AM - 12:00 AM',
        stops: ['Times Square', 'Herald Square', 'Union Square', 'Wall Street']
      },
      {
        id: '2',
        number: '15',
        name: 'Crosstown Local',
        description: 'East-west service across the city',
        frequency: 'Every 8-12 minutes',
        operatingHours: '5:30 AM - 11:30 PM',
        stops: ['Central Park', 'Museum Mile', 'Lexington Ave', 'FDR Drive']
      },
      {
        id: '3',
        number: '23',
        name: 'University Line',
        description: 'Connects major universities and colleges',
        frequency: 'Every 15 minutes',
        operatingHours: '6:00 AM - 10:00 PM',
        stops: ['Columbia University', 'NYU', 'The New School', 'Penn Station']
      }
    ];
  },

  getRouteDetails: async (routeId: string): Promise<Route> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest(`/routes/${routeId}`);
    // return response.json();

    // Mock implementation for now
    const allRoutes = await routesAPI.getAllRoutes();
    return allRoutes.find(route => route.id === routeId) || allRoutes[0];
  },

  searchRoutes: async (query: string): Promise<Route[]> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest(`/routes/search?q=${encodeURIComponent(query)}`);
    // return response.json();

    // Mock implementation for now
    const allRoutes = await routesAPI.getAllRoutes();
    const searchQuery = query.toLowerCase();
    return allRoutes.filter(route =>
      route.number.toLowerCase().includes(searchQuery) ||
      route.name.toLowerCase().includes(searchQuery) ||
      route.description.toLowerCase().includes(searchQuery)
    );
  },
};

// Search API
export const searchAPI = {
  searchAll: async (query: string): Promise<{
    routes: Route[];
    stops: Stop[];
  }> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest(`/search?q=${encodeURIComponent(query)}`);
    // return response.json();

    // Mock implementation for now
    const [routes, stops] = await Promise.all([
      routesAPI.searchRoutes(query),
      stopsAPI.getAllStops().then(allStops => {
        const searchQuery = query.toLowerCase();
        return allStops.filter(stop =>
          stop.name.toLowerCase().includes(searchQuery) ||
          stop.routes.some(route => route.toLowerCase().includes(searchQuery))
        );
      })
    ]);

    return { routes, stops };
  },
};

// User preferences API
export const userAPI = {
  updatePreferences: async (preferences: Partial<User['preferences']>): Promise<User> => {
    // TODO: Replace with actual API call
    // const response = await makeAuthenticatedRequest('/user/preferences', {
    //   method: 'PUT',
    //   body: JSON.stringify(preferences),
    // });
    // return response.json();

    // Mock implementation for now
    const storedUser = localStorage.getItem('busTracker_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const updatedUser = {
        ...user,
        preferences: { ...user.preferences, ...preferences }
      };
      localStorage.setItem('busTracker_user', JSON.stringify(updatedUser));
      return updatedUser;
    }
    throw new Error('User not found');
  },

  addFavorite: async (id: string, type: 'route' | 'stop'): Promise<void> => {
    // TODO: Replace with actual API call
    // await makeAuthenticatedRequest('/user/favorites', {
    //   method: 'POST',
    //   body: JSON.stringify({ id, type }),
    // });

    // Mock implementation for now
    const storedUser = localStorage.getItem('busTracker_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const favorites = user.preferences.favoriteRoutes;
      if (!favorites.includes(id)) {
        favorites.push(id);
        localStorage.setItem('busTracker_user', JSON.stringify(user));
      }
    }
  },

  removeFavorite: async (id: string): Promise<void> => {
    // TODO: Replace with actual API call
    // await makeAuthenticatedRequest(`/user/favorites/${id}`, {
    //   method: 'DELETE',
    // });

    // Mock implementation for now
    const storedUser = localStorage.getItem('busTracker_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      user.preferences.favoriteRoutes = user.preferences.favoriteRoutes.filter(
        (fav: string) => fav !== id
      );
      localStorage.setItem('busTracker_user', JSON.stringify(user));
    }
  },
};

// Error handling helper
export const handleAPIError = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes('401')) {
      // Token expired or invalid
      localStorage.removeItem('busTracker_token');
      localStorage.removeItem('busTracker_user');
      return 'Session expired. Please log in again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.';
    }
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    return error.message;
  }
  return 'An unexpected error occurred.';
};

// WebSocket connection for real-time updates
export class BusTrackingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private onBusUpdate: (buses: BusLocation[]) => void,
    private onStopUpdate: (stops: Stop[]) => void,
    private onError: (error: string) => void
  ) {}

  connect(): void {
    const wsUrl = apiConfig.wsURL;
    const token = getAuthToken();

    try {
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        // Subscribe to live updates
        this.send({ type: 'subscribe', data: ['buses', 'stops'] });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError('Connection error occurred');
      };
    } catch (error) {
      this.onError('Failed to establish WebSocket connection');
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'bus_update':
        this.onBusUpdate(message.data);
        break;
      case 'stop_update':
        this.onStopUpdate(message.data);
        break;
      case 'error':
        this.onError(message.message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}