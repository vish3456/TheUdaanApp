import React, { useEffect, useState, useCallback } from 'react';
import { Bus, MapPin, Navigation, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { busAPI, stopsAPI, BusLocation, Stop as APIStop, BusTrackingWebSocket, handleAPIError } from '../services/api';

interface BusStop extends APIStop {}

const BOUNDS = {
  minLat: 40.700,
  maxLat: 40.800,
  minLng: -74.020,
  maxLng: -73.940
};

const latLngToPixel = (lat: number, lng: number, mapWidth: number, mapHeight: number) => {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * mapWidth;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * mapHeight;
  return { x, y };
};

const BusIcon = ({ occupancy }: { occupancy: string }) => {
  const getColor = () => {
    switch (occupancy) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
      <div
          className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg"
          style={{ backgroundColor: getColor() }}
      >
        <Bus className="w-4 h-4 text-white" />
      </div>
  );
};

const StopIcon = () => (
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg">
      <MapPin className="w-3 h-3 text-white" />
    </div>
);

interface MapProps {
  selectedBus: BusLocation | null;
  onBusSelect: (bus: BusLocation) => void;
  onStopSelect: (stop: BusStop) => void;
}

export default function Map({ selectedBus, onBusSelect, onStopSelect }: MapProps) {
  const [buses, setBuses] = useState<BusLocation[]>([]);
  const [stops, setStops] = useState<BusStop[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [zoomLevel, setZoomLevel] = useState(13);
  const [selectedMarker, setSelectedMarker] = useState<{ type: 'bus' | 'stop'; data: any } | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 600 });
  const [locationLoading, setLocationLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState<BusTrackingWebSocket | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      const mapElement = document.getElementById('custom-map');
      if (mapElement) {
        setMapDimensions({
          width: mapElement.clientWidth,
          height: mapElement.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const isGeolocationAvailable = 'geolocation' in navigator;

  const loadInitialData = useCallback(async () => {
    try {
      setDataLoading(true);
      const [busesData, stopsData] = await Promise.all([
        busAPI.getLiveBuses(),
        stopsAPI.getAllStops()
      ]);
      setBuses(busesData);
      setStops(stopsData);
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(`Failed to load map data: ${errorMessage}`);
      console.error('Map data loading error:', error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const ws = new BusTrackingWebSocket(
        (updatedBuses) => setBuses(updatedBuses),
        (updatedStops) => setStops(updatedStops),
        (error) => {
          console.error('WebSocket error:', error);
        }
    );

    const updateInterval = setInterval(async () => {
      try {
        const bounds = {
          north: mapCenter.lat + 0.05,
          south: mapCenter.lat - 0.05,
          east: mapCenter.lng + 0.05,
          west: mapCenter.lng - 0.05
        };
        const updatedBuses = await busAPI.getLiveBuses(bounds);
        setBuses(updatedBuses);
      } catch (error) {
        console.error('Failed to update bus locations:', error);
      }
    }, 10000);

    setWsConnection(ws);

    return () => {
      clearInterval(updateInterval);
      ws.disconnect();
    };
  }, [mapCenter]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
          setLocationLoading(false);
          toast.success('Location found successfully');
        },
        (error) => {
          setLocationLoading(false);

          let errorMessage = 'Location access denied';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred while retrieving location';
              break;
          }

          console.error('Geolocation error:', {
            code: error.code,
            message: error.message
          });

          toast.error(errorMessage);

          const fallbackLocation = { lat: 40.7128, lng: -74.0060 };
          setMapCenter(fallbackLocation);
          toast.info('Using default location: New York City');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
    );
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 8));
  };

  const handleMarkerClick = (type: 'bus' | 'stop', data: any) => {
    setSelectedMarker({ type, data });
    if (type === 'bus') {
      onBusSelect(data);
    } else {
      onStopSelect(data);
    }
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedMarker(null);
    }
  };

  const getMarkerPosition = (lat: number, lng: number) => {
    const zoomFactor = Math.pow(2, zoomLevel - 10);
    return latLngToPixel(
        lat - (mapCenter.lat - 40.7128) / zoomFactor,
        lng - (mapCenter.lng - (-74.0060)) / zoomFactor,
        mapDimensions.width,
        mapDimensions.height
    );
  };

  return (
      <div className="relative w-full h-full bg-gray-100 overflow-hidden">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <Button
              onClick={getCurrentLocation}
              disabled={locationLoading || !isGeolocationAvailable}
              className="shadow-lg"
              size="sm"
              title={!isGeolocationAvailable ? 'Geolocation not supported' : 'Get your current location'}
          >
            {locationLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <Navigation className="w-4 h-4 mr-2" />
            )}
            {locationLoading ? 'Finding...' : 'My Location'}
          </Button>
          <div className="flex flex-col gap-1">
            <Button
                onClick={handleZoomIn}
                variant="outline"
                size="sm"
                className="shadow-lg"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
                onClick={handleZoomOut}
                variant="outline"
                size="sm"
                className="shadow-lg"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Custom Map Container */}
        <div
            id="custom-map"
            className="w-full h-full relative cursor-default"
            onClick={handleMapClick}
            style={{
              backgroundImage: `
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
              backgroundSize: '50px 50px',
              backgroundColor: '#e8f5e8',
            }}
        >
          {/* Grid overlay to simulate map */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#888" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Street overlay */}
          <div className="absolute inset-0">
            <svg width="100%" height="100%">
              <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#ccc" strokeWidth="3" />
              <line x1="0" y1="60%" x2="100%" y2="60%" stroke="#ccc" strokeWidth="3" />
              <line x1="20%" y1="0" x2="20%" y2="100%" stroke="#ccc" strokeWidth="3" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#ccc" strokeWidth="3" />
              <line x1="80%" y1="0" x2="80%" y2="100%" stroke="#ccc" strokeWidth="3" />
            </svg>
          </div>

          {/* Bus markers */}
          {buses.map((bus) => {
            const position = getMarkerPosition(bus.lat, bus.lng);
            if (
                position.x < 0 ||
                position.x > mapDimensions.width ||
                position.y < 0 ||
                position.y > mapDimensions.height
            ) {
              return null;
            }

            return (
                <div
                    key={bus.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                    style={{ left: position.x, top: position.y }}
                    onClick={() => handleMarkerClick('bus', bus)}
                >
                  <BusIcon occupancy={bus.occupancy} />
                  {selectedMarker?.type === 'bus' && selectedMarker.data.id === bus.id && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20">
                        <Card className="p-2 shadow-lg min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <Bus className="w-4 h-4" />
                            <span className="font-medium">Route {bus.routeNumber}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Direction: {bus.direction}</p>
                          <p className="text-sm text-muted-foreground">Next: {bus.nextStop}</p>
                          <p className="text-sm text-muted-foreground">ETA: {bus.estimatedArrival}</p>
                        </Card>
                      </div>
                  )}
                </div>
            );
          })}

          {/* Bus stop markers */}
          {stops.map((stop) => {
            const position = getMarkerPosition(stop.lat, stop.lng);
            if (
                position.x < 0 ||
                position.x > mapDimensions.width ||
                position.y < 0 ||
                position.y > mapDimensions.height
            ) {
              return null;
            }

            return (
                <div
                    key={stop.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                    style={{ left: position.x, top: position.y }}
                    onClick={() => handleMarkerClick('stop', stop)}
                >
                  <StopIcon />
                  {selectedMarker?.type === 'stop' && selectedMarker.data.id === stop.id && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20">
                        <Card className="p-2 shadow-lg min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">{stop.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Routes: {stop.routes.join(', ')}
                          </p>
                        </Card>
                      </div>
                  )}
                </div>
            );
          })}

          {/* User location marker */}
          {userLocation && (
              <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: getMarkerPosition(userLocation.lat, userLocation.lng).x,
                    top: getMarkerPosition(userLocation.lat, userLocation.lng).y
                  }}
              >
                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse" />
              </div>
          )}

          {/* Fixed marker for coordinates 40.7128, -74.006 */}
          {(() => {
            const pos = getMarkerPosition(40.7128, -74.006);
            if (
                pos.x < 0 ||
                pos.x > mapDimensions.width ||
                pos.y < 0 ||
                pos.y > mapDimensions.height
            ) {
              return null;
            }
            return (
                <div
                    key="fixed-marker"
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-default z-20"
                    style={{ left: pos.x, top: pos.y }}
                    title="Fixed Marker: New York City"
                >
                  <div className="w-5 h-5 bg-red-800 rounded-full border-4 border-red-900 shadow-lg" />


                </div>
            );
          })()}

          {/* Map info overlay */}
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
            <p>Zoom: {zoomLevel}</p>
            <p>Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}</p>
            {userLocation && (
                <p>Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
            )}
            {!isGeolocationAvailable && (
                <p className="text-yellow-600">Geolocation unavailable</p>
            )}
            <p className="text-green-600">
              Buses: {buses.length} | Stops: {stops.length}
            </p>
            {dataLoading && (
                <p className="text-blue-600">Loading map data...</p>
            )}
          </div>
        </div>
      </div>
  );
}
