import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Bus, Clock, Users, Star, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { searchAPI, routesAPI, stopsAPI, Route, Stop, handleAPIError } from '../services/api';
import { toast } from 'sonner@2.0.3';

// Types now imported from API service

interface SearchPanelProps {
  onRouteSelect: (route: Route) => void;
  onStopSelect: (stop: Stop) => void;
  userFavorites: string[];
  onToggleFavorite: (id: string, type: 'route' | 'stop') => void;
}

// Mock data removed - now using API service

export default function SearchPanel({ 
  onRouteSelect, 
  onStopSelect, 
  userFavorites, 
  onToggleFavorite 
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'routes' | 'stops'>('all');
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [filteredStops, setFilteredStops] = useState<Stop[]>([]);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [allStops, setAllStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [routes, stops] = await Promise.all([
          routesAPI.getAllRoutes(),
          stopsAPI.getAllStops()
        ]);
        setAllRoutes(routes);
        setAllStops(stops);
        setFilteredRoutes(routes);
        setFilteredStops(stops);
      } catch (error) {
        const errorMessage = handleAPIError(error);
        toast.error(`Failed to load data: ${errorMessage}`);
        console.error('Search panel data loading error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Search function with debouncing
  const performSearch = useCallback(async (query: string) => {
    if (query.trim() === '') {
      setFilteredRoutes(allRoutes);
      setFilteredStops(allStops);
      return;
    }

    try {
      setSearching(true);
      const { routes, stops } = await searchAPI.searchAll(query);
      setFilteredRoutes(routes);
      setFilteredStops(stops);
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(`Search failed: ${errorMessage}`);
      console.error('Search error:', error);
      
      // Fallback to local filtering
      const query_lower = query.toLowerCase();
      const routes = allRoutes.filter(route =>
        route.number.toLowerCase().includes(query_lower) ||
        route.name.toLowerCase().includes(query_lower) ||
        route.description.toLowerCase().includes(query_lower)
      );
      
      const stops = allStops.filter(stop =>
        stop.name.toLowerCase().includes(query_lower) ||
        stop.routes.some(route => route.toLowerCase().includes(query_lower))
      );
      
      setFilteredRoutes(routes);
      setFilteredStops(stops);
    } finally {
      setSearching(false);
    }
  }, [allRoutes, allStops]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const getOccupancyColor = (occupancy: string) => {
    switch (occupancy) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOccupancyText = (occupancy: string) => {
    switch (occupancy) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      default: return 'Unknown';
    }
  };

  const isFavorite = (id: string) => userFavorites.includes(id);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading transit data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className={`absolute left-3 top-3 h-4 w-4 text-muted-foreground ${searching ? 'animate-pulse' : ''}`} />
          <Input
            placeholder="Search routes, stops, or destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />
          )}
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            variant={searchType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType('all')}
          >
            All
          </Button>
          <Button
            variant={searchType === 'routes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType('routes')}
          >
            Routes
          </Button>
          <Button
            variant={searchType === 'stops' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSearchType('stops')}
          >
            Stops
          </Button>
        </div>
      </div>

      {/* Search Results */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Routes Section */}
          {(searchType === 'all' || searchType === 'routes') && filteredRoutes.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-3">
                <Bus className="w-4 h-4" />
                Routes ({filteredRoutes.length})
              </h3>
              <div className="space-y-2">
                {filteredRoutes.map((route) => (
                  <Card 
                    key={route.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onRouteSelect(route)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {route.number}
                            </Badge>
                            <span className="font-medium">{route.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {route.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {route.frequency}
                            </span>
                            <span>{route.operatingHours}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(route.id, 'route');
                          }}
                        >
                          <Star 
                            className={`w-4 h-4 ${
                              isFavorite(route.id) ? 'fill-yellow-400 text-yellow-400' : ''
                            }`} 
                          />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {(searchType === 'all') && filteredRoutes.length > 0 && filteredStops.length > 0 && (
            <Separator />
          )}

          {/* Stops Section */}
          {(searchType === 'all' || searchType === 'stops') && filteredStops.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" />
                Stops ({filteredStops.length})
              </h3>
              <div className="space-y-2">
                {filteredStops.map((stop) => (
                  <Card 
                    key={stop.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onStopSelect(stop)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{stop.name}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {stop.routes.map((route) => (
                              <Badge key={route} variant="outline" className="text-xs">
                                {route}
                              </Badge>
                            ))}
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground mb-1">Next arrivals:</p>
                            {stop.nextArrivals.slice(0, 2).map((arrival, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <Badge variant="secondary" className="text-xs">
                                  {arrival.route}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {arrival.direction}
                                </span>
                                <span className="font-medium">{arrival.eta}</span>
                                <div className="flex items-center gap-1">
                                  <div 
                                    className={`w-2 h-2 rounded-full ${getOccupancyColor(arrival.occupancy)}`}
                                  />
                                  <span className="text-muted-foreground">
                                    {getOccupancyText(arrival.occupancy)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(stop.id, 'stop');
                          }}
                        >
                          <Star 
                            className={`w-4 h-4 ${
                              isFavorite(stop.id) ? 'fill-yellow-400 text-yellow-400' : ''
                            }`} 
                          />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && filteredRoutes.length === 0 && filteredStops.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No results found for "{searchQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Try searching for route numbers, stop names, or destinations
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}