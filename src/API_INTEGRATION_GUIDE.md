# Bus Tracker API Integration Guide

## Overview

The Bus Tracker application has been prepared for backend API integration while maintaining full functionality with mock data. This document outlines the API service layer and integration points.

## API Service Layer (`/services/api.ts`)

### Core Components

1. **Authentication API (`authAPI`)**
   - Login and signup functionality
   - Token management
   - User profile handling

2. **Bus Tracking API (`busAPI`)**
   - Real-time bus location updates
   - Bus details and status information
   - Route-specific bus filtering

3. **Stops and Routes API (`stopsAPI`, `routesAPI`)**
   - Stop information and live arrivals
   - Route details and schedules
   - Nearby stops discovery

4. **Search API (`searchAPI`)**
   - Unified search across routes and stops
   - Real-time filtering

5. **User Preferences API (`userAPI`)**
   - Favorites management
   - User settings persistence

6. **WebSocket Connection (`BusTrackingWebSocket`)**
   - Real-time updates for bus locations
   - Live arrival information
   - Connection management and reconnection logic

## Integration Points

### API Configuration

The application uses a browser-compatible configuration system located in `/config/api.ts`. You can configure API endpoints in several ways:

#### Method 1: Runtime Configuration (Recommended)
```javascript
// In your HTML file or before the app loads
window.__BUS_TRACKER_CONFIG__ = {
  baseURL: 'https://your-api.com/api',
  wsURL: 'wss://your-api.com/ws',
  enableMockMode: false
};
```

#### Method 2: localStorage Configuration (Development)
```javascript
// In browser console or initialization script
localStorage.setItem('busTracker_config', JSON.stringify({
  baseURL: 'http://localhost:3001/api',
  wsURL: 'ws://localhost:3001/ws',
  enableMockMode: false
}));
```

#### Method 3: Modify Default Configuration
Edit `/config/api.ts` directly to change default values.

### API Endpoints to Implement

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh` - Token refresh

#### Bus Tracking
- `GET /api/buses/live` - Get live bus locations
- `GET /api/buses/:id` - Get bus details
- `GET /api/routes/:routeNumber/buses` - Get buses for specific route

#### Stops and Routes
- `GET /api/stops` - Get all stops
- `GET /api/stops/:id` - Get stop details
- `GET /api/stops/nearby` - Get nearby stops
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get route details

#### Search
- `GET /api/search` - Search routes and stops

#### User Management
- `PUT /api/user/preferences` - Update user preferences
- `POST /api/user/favorites` - Add favorite
- `DELETE /api/user/favorites/:id` - Remove favorite

### WebSocket Events

#### Client → Server
```json
{
  "type": "subscribe",
  "data": ["buses", "stops"]
}
```

#### Server → Client
```json
{
  "type": "bus_update",
  "data": [/* BusLocation objects */]
}
```

```json
{
  "type": "stop_update", 
  "data": [/* Stop objects */]
}
```

## Current Implementation Status

### ✅ Ready for API Integration
- Complete service layer with TypeScript interfaces
- Error handling and retry logic
- Authentication token management
- WebSocket connection management
- Loading states and error UI
- Toast notifications for API feedback

### 📝 Mock Data Currently Used
- All API calls return mock data
- WebSocket connection commented out (uses polling)
- Local storage for user preferences

### 🔄 To Enable Real APIs

1. **Update Configuration**: Set `enableMockMode: false` in your API configuration
2. **Configure Endpoints**: Set the correct `baseURL` and `wsURL` values
3. **Update Backend**: Ensure backend implements the documented endpoints
4. **Test Connection**: The app will automatically switch from mock to real API calls

## Data Flow

```
User Action → Component → API Service → Backend API → Response → State Update → UI Update
```

### Real-time Updates Flow

```
Backend Event → WebSocket → BusTrackingWebSocket → Component State → Map Update
```

## Error Handling

The application includes comprehensive error handling:

- **Network failures**: Automatic retry with exponential backoff
- **Authentication errors**: Automatic token refresh and re-login prompts
- **API timeouts**: 10-second timeout with user feedback
- **Offline scenarios**: Graceful degradation to cached data

## Security Considerations

- JWT tokens stored securely in localStorage
- Automatic token refresh mechanism
- API request authentication headers
- WebSocket connection authentication
- Input validation and sanitization

## Performance Optimizations

- **Debounced search**: 300ms delay to reduce API calls
- **Polling intervals**: 10-second updates for live data
- **Conditional rendering**: Loading states prevent unnecessary renders
- **Data caching**: Local state caching for better UX

## Testing the Integration

1. Start your backend server on `localhost:3001`
2. Update the API service to use real endpoints
3. Test each feature:
   - Login/signup flow
   - Real-time bus tracking
   - Stop details and arrivals
   - Search functionality
   - Favorites management

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure backend allows requests from frontend origin
2. **WebSocket connection failures**: Check WebSocket server configuration
3. **Token expiration**: Verify refresh token mechanism
4. **Slow API responses**: Check timeout settings and loading states

### Debug Mode

Enable API debugging by setting:
```javascript
localStorage.setItem('debug_api', 'true');
```

This will log all API requests and responses to the console.

## Future Enhancements

- **Offline support**: Service worker for cached data
- **Push notifications**: Real-time alerts for delays
- **Analytics**: User behavior tracking
- **A/B testing**: Feature flag support
- **Internationalization**: Multi-language support

---

The application is now fully prepared for backend integration while maintaining excellent user experience with mock data during development.