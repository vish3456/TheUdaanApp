import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  Route, 
  AlertTriangle,
  Wifi,
  Zap,
  Accessibility,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { busAPI, BusLocation, BusDetails, handleAPIError } from '../services/api';
import { toast } from 'sonner@2.0.3';

// Types now imported from API service

interface BusDetailsPanelProps {
  bus: BusLocation | null;
  onClose: () => void;
}

// Mock data removed - now using API service

export default function BusDetailsPanel({ bus, onClose }: BusDetailsPanelProps) {
  const [busDetails, setBusDetails] = useState<BusDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bus) {
      const loadBusDetails = async () => {
        try {
          setLoading(true);
          setError(null);
          const details = await busAPI.getBusDetails(bus.id);
          setBusDetails(details);
        } catch (err) {
          const errorMessage = handleAPIError(err);
          setError(errorMessage);
          toast.error(`Failed to load bus details: ${errorMessage}`);
          console.error('Bus details loading error:', err);
        } finally {
          setLoading(false);
        }
      };

      loadBusDetails();
    }
  }, [bus]);

  if (!bus) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading bus details...</p>
        </div>
      </div>
    );
  }

  if (error || !busDetails) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Failed to Load Bus Details</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error || 'Unable to fetch bus information.'}
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
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertVariant = (type: string): "default" | "destructive" => {
    return type === 'error' ? 'destructive' : 'default';
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'usb charging': return <Zap className="w-4 h-4" />;
      case 'wheelchair accessible': return <Accessibility className="w-4 h-4" />;
      default: return <Bus className="w-4 h-4" />;
    }
  };

  const routeProgress = (busDetails.completedStops / busDetails.totalStops) * 100;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="flex items-center gap-2">
                Route {busDetails.routeNumber}
                <Badge variant="secondary">{busDetails.vehicleNumber}</Badge>
              </h2>
              <p className="text-sm text-muted-foreground">{busDetails.route.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Alerts */}
        {busDetails.alerts.map((alert, index) => (
          <Alert key={index} variant={getAlertVariant(alert.type)}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        ))}

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Next Stop</p>
                <p className="font-medium">{busDetails.nextStop}</p>
                <p className="text-sm text-muted-foreground">
                  ETA: {busDetails.estimatedArrival}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Direction</p>
                <p className="font-medium">{busDetails.direction}</p>
                <p className="text-sm text-muted-foreground">
                  Speed: {busDetails.currentSpeed} mph
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Route Progress</p>
                <p className="text-sm text-muted-foreground">
                  {busDetails.completedStops}/{busDetails.totalStops} stops
                </p>
              </div>
              <Progress value={routeProgress} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className={`text-sm font-medium ${getOccupancyColor(busDetails.occupancy)}`}>
                  {busDetails.occupancyPercentage}%
                </p>
              </div>
              <Progress 
                value={busDetails.occupancyPercentage} 
                className="h-2"
              />
            </div>

            {busDetails.delay > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">
                  Running {busDetails.delay} minute{busDetails.delay > 1 ? 's' : ''} behind schedule
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Stops */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              Upcoming Stops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {busDetails.upcomingStops.map((stop, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      stop.isNext ? 'bg-primary' : 'bg-muted'
                    }`} />
                    <span className={stop.isNext ? 'font-medium' : 'text-muted-foreground'}>
                      {stop.name}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {stop.eta}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bus Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-4 h-4" />
              Bus Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-medium">{busDetails.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">{busDetails.driver}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {busDetails.amenities.map((amenity, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {getAmenityIcon(amenity)}
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle>Route Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{busDetails.route.name}</p>
              <p className="text-sm text-muted-foreground">{busDetails.route.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">First Bus</p>
                <p className="font-medium">{busDetails.route.startTime}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Bus</p>
                <p className="font-medium">{busDetails.route.endTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}