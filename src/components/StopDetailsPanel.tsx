import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Bus, 
  Clock, 
  Users, 
  Star,
  Accessibility,
  Wifi,
  Umbrella,
  Shield,
  Navigation,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { stopsAPI, StopDetails, handleAPIError } from '../services/api';
import { toast } from 'sonner@2.0.3';

// Import Stop interface from API service
import { Stop } from '../services/api';

// StopDetails now imported from API service

interface StopDetailsPanelProps {
  stop: Stop | null;
  onClose: () => void;
  onGetDirections: (stop: Stop) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

// Mock data removed - now using API service

export default function StopDetailsPanel({ 
  stop, 
  onClose, 
  onGetDirections, 
  isFavorite, 
  onToggleFavorite 
}: StopDetailsPanelProps) {
  const [stopDetails, setStopDetails] = useState<StopDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stop) {
      const loadStopDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          const details = await stopsAPI.getStopDetails(stop.id);
          setStopDetails(details);
        } catch (err) {
          const errorMessage = handleAPIError(err);
          setError(errorMessage);
          toast.error(`Failed to load stop details: ${errorMessage}`);
          console.error('Stop details loading error:', err);
        } finally {
          setLoading(false);
        }
      };

      loadStopDetails();
    }
  }, [stop]);

  if (!stop) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading stop details...</p>
        </div>
      </div>
    );
  }

  if (error || !stopDetails) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Failed to Load Stop Details</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'Unable to fetch stop information.'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Retry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getOccupancyColor = (occupancy: string) => {
    switch (occupancy) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOccupancyTextColor = (occupancy: string) => {
    switch (occupancy) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getFacilityIcon = (iconName: string) => {
    switch (iconName) {
      case 'accessibility': return <Accessibility className="w-4 h-4" />;
      case 'umbrella': return <Umbrella className="w-4 h-4" />;
      case 'shield': return <Shield className="w-4 h-4" />;
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'clock': return <Clock className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const sortedArrivals = stopDetails.liveArrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2>{stopDetails.name}</h2>
              <p className="text-sm text-muted-foreground">{stopDetails.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleFavorite}
            >
              <Star 
                className={`w-4 h-4 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} 
              />
            </Button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button 
            size="sm" 
            onClick={() => onGetDirections(stop)}
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Directions
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Live Arrivals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-4 h-4" />
              Live Arrivals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedArrivals.map((arrival, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {arrival.route}
                    </Badge>
                    <div>
                      <p className="font-medium">{arrival.direction}</p>
                      <p className="text-sm text-muted-foreground">
                        {arrival.routeName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{arrival.eta}</span>
                      {arrival.isRealTime && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Real-time" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${getOccupancyColor(arrival.occupancy)}`} />
                      <span className={`text-xs ${getOccupancyTextColor(arrival.occupancy)}`}>
                        {arrival.occupancyPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Routes at this Stop</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stopDetails.routes.map((route, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{route.number}</Badge>
                    <div>
                      <p className="font-medium">{route.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {route.frequency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Facilities */}
        <Card>
          <CardHeader>
            <CardTitle>Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {stopDetails.facilities.map((facility, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 p-2 rounded ${
                    facility.available ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {getFacilityIcon(facility.icon)}
                  <span className="text-sm">{facility.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Accessibility className="w-4 h-4" />
              Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Wheelchair Accessible</span>
                <span className={`text-sm ${stopDetails.accessibility.wheelchairAccessible ? 'text-green-600' : 'text-red-600'}`}>
                  {stopDetails.accessibility.wheelchairAccessible ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tactile Paving</span>
                <span className={`text-sm ${stopDetails.accessibility.tactilePaving ? 'text-green-600' : 'text-red-600'}`}>
                  {stopDetails.accessibility.tactilePaving ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Audio Announcements</span>
                <span className={`text-sm ${stopDetails.accessibility.audioAnnouncements ? 'text-green-600' : 'text-red-600'}`}>
                  {stopDetails.accessibility.audioAnnouncements ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Connections */}
        {stopDetails.transferConnections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Transfer Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stopDetails.transferConnections.map((connection, index) => (
                  <p key={index} className="text-sm">{connection}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nearby Points of Interest */}
        <Card>
          <CardHeader>
            <CardTitle>Nearby Places</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stopDetails.nearbyPOIs.map((poi, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{poi.name}</p>
                    <p className="text-xs text-muted-foreground">{poi.category}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{poi.distance}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}